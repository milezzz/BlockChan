import { Injectable } from '@angular/core';
import {Buffer} from 'buffer';
import { IndImmChanPostService } from './ind-imm-chan-post.service';
import { map, filter, switchMap } from 'rxjs/operators';
import { IndImmChanPost } from './ind-imm-chan-post';
import { IndImmChanPostModel } from './ind-imm-chan-post-model';
import { IndImmChanThread } from './ind-imm-chan-thread';
import { IndImmConfigService } from './ind-imm-config.service';
import { PostKey } from './post-key';
import { ChunkingUtility } from './chunking-utility';
import { PostModFlag } from './post-mod-flag';
import { SubPost } from './sub-post';
import { promise } from 'protractor';
import { LoadingCalculatorService } from './loading-calculator.service';
import { GlobalEventService } from './global-event.service';
import { PostReturnResult } from './post-return-result';


@Injectable({
  providedIn: 'root'
})
export class IndImmChanPostManagerService {
  IndImmChanPostService: IndImmChanPostService;
  Config: IndImmConfigService;
  LoadingCalculatorService: LoadingCalculatorService;
  GlobalEventService: GlobalEventService;

  UID = '';

 
  public GetUID(): string {
    if (this.UID.length == 0) {
      return this.SetUID();
    } else {
      return localStorage.getItem('UID');
    }
  } 

 /*
  public GetUID(): string {
    if (this.UID.length == 0) {
      const uid = localStorage.getItem('UID');
      if (uid && uid.length > 0) {
        this.UID = uid;
        return this.UID;
      } else {
        return this.SetUID();
      }
    } else {
      return this.UID;
    }
  } */

  public SetUID(): string {
    const cu: ChunkingUtility = new ChunkingUtility();
    this.UID = cu.GetFingerPrint();
    try {
    localStorage.setItem('UID', this.UID);
    } catch (error) {
      console.log('storage probably maxed out');
    }
    
    return this.UID;
  }

  constructor(indImmChanPostService: IndImmChanPostService, config: IndImmConfigService, loadingCalculatorService: LoadingCalculatorService
    , globalEventService: GlobalEventService) {
    this.IndImmChanPostService = indImmChanPostService;
    this.Config = config;
    this.LoadingCalculatorService = loadingCalculatorService;
    this.GlobalEventService = globalEventService;

    this.GlobalEventService.PercentLoaded.subscribe(percent => {
      console.log('Percent Loaded: ' + percent);
    });
  }

  public async post(title: string, message: string, name: string, fileToUpload: File, board: string, parent: string, key: PostKey,
    ethTipAddress: string, useTrip: boolean, flag: string) : Promise<PostReturnResult> {
    const result: PostReturnResult = new PostReturnResult();
    const post: IndImmChanPost = new IndImmChanPost();
    post.Name = name;
    post.Title = title.replace(/[^\x00-\x7F]/g, '');;
    post.Msg = encodeURI(message); //.replace(/[^\x00-\x7F]/g, '');;
    post.Parent = parent;
    post.ETH = ethTipAddress;
    post.UID = this.GetUID();
    post.T = useTrip;
    post.F = flag;
    //post.Msg  = post.Msg;
    // title = title.replace(/[^\x00-\x7F]/g, "");;

    let postMemoType = '';

    if(!parent || parent.length == 0) {
      postMemoType = this.IndImmChanPostService.AddressManagerService.GetChildPostMemoType();
    } else {
      postMemoType = this.IndImmChanPostService.AddressManagerService.GetParentPostMemoType();

    }
    if(fileToUpload) {
      const result = await this.IndImmChanPostService.postToIPFS(fileToUpload);
      post.IPFSHash = result.IpfsHash;
    } else {
      post.IPFSHash = '';        
    }

    result.IPFSHash = post.IPFSHash;

    if(key) {
      const cu: ChunkingUtility = new ChunkingUtility();
      post.Msg = await cu.EncryptMessage(post.Msg, key.Key, key.IVAsUint8);
      post.Title = await cu.EncryptMessage(post.Title, key.Key, key.IVAsUint8);
      post.Enc= true;
      if(fileToUpload) {
        post.IPFSHash = await cu.EncryptMessage(post.IPFSHash, key.Key, key.IVAsUint8);
      }
    }
    const minLedger = await this.IndImmChanPostService.rippleService.earliestLedgerVersion;
    if(post.Msg.length <= 420) {
      const txResult  = await this.IndImmChanPostService.postToRipple(post, board, postMemoType);
      result.TX = txResult;
      return result;
    } else {
      const txResult  = await this.IndImmChanPostService.postToRippleWithSubMessage(post, board, postMemoType);
      result.TX = txResult;
      return result;
    }
  }

  public async RemoveFlaggedPost(posts: any[]) {
    if (!this.Config.ModerationOn) {
      return posts;
    }
    const minLedger = this.IndImmChanPostService.rippleService.earliestLedgerVersion;
    const max = this.IndImmChanPostService.rippleService.maxLedgerVersion;
    const moddedPosts: any[] = 
      await this.IndImmChanPostService.rippleService.api.getTransactions(this.IndImmChanPostService.AddressManagerService.GetWarningsAddress(),
      {minLedgerVersion: minLedger, maxLedgerVersion: max});


    const filteredPosts = [];
    for (let i = 0; i < posts.length; i++) {
      let isModded = false;
      for (let j = 0; j < moddedPosts.length; j++) {
        if ('memos' in moddedPosts[j].specification) {
          let flag: PostModFlag  = null;

          try {
            const dataToParse = moddedPosts[j].specification.memos[0].data;
            flag  = JSON.parse(dataToParse);

            if (flag.Tx === posts[i].id) {
              const modCheck = this.IndImmChanPostService.AddressManagerService.wa();
              if(moddedPosts[j].address === modCheck) {
                isModded = true;
              }
            }
          } catch (error) {
            // console.log(error);
            continue;
          }
        }
      }
      if(!isModded) {
        filteredPosts.push(posts[i]);
      }
    }
    return filteredPosts;
  }

  
  public async GetPostsForPostViewerOld(boardAddress: string, parent: string): Promise<IndImmChanThread> {
    await this.IndImmChanPostService.rippleService.ForceConnectIfNotConnected();
    while (!this.IndImmChanPostService.rippleService.Connected) {
      await this.IndImmChanPostService.chunkingUtility.sleep(1000);
    }
    const minLedger = 49187118;
    const max = this.IndImmChanPostService.rippleService.maxLedgerVersion;
    let imageCounter = 1;

    const unfilteredResultsUnModded: any[] = await this.IndImmChanPostService.rippleService.api.getTransactions(boardAddress,
      {minLedgerVersion: minLedger, maxLedgerVersion: max});

      const unfilteredResults = await this.RemoveFlaggedPost(unfilteredResultsUnModded);
      const postSet: IndImmChanPostModel[] = [];
      const retSet: IndImmChanThread[] = [];
      const childSet: IndImmChanPostModel[] = [];
      const subPosts: SubPost[] = [];
      const allPosts: IndImmChanPostModel[] = [];

      for (let i = 0; i < unfilteredResults.length; i++) {
        if ('memos' in unfilteredResults[i].specification) {
          try {
            if(unfilteredResults[i].specification.memos[0].type === 'submsg') {
              const subPostToParse = unfilteredResults[i].specification.memos[0].data;
              let subPost: SubPost  = JSON.parse(subPostToParse);
              subPost.Tx = unfilteredResults[i].id;
              subPosts.push(subPost);
              continue;
            }
          } catch(error) {
            // console.log(error);
            continue;
          }
          let post: IndImmChanPost  = null;

          try {
            const dataToParse = unfilteredResults[i].specification.memos[0].data;
            post  = JSON.parse(dataToParse);

            if (post.Name.length === 0) {
              continue;
            }
          } catch (error) {
            // console.log(error);
            continue;
          }

          const postModel: IndImmChanPostModel = new IndImmChanPostModel();
          
          postModel.SendingAddress = unfilteredResults[i].address;
          const cu: ChunkingUtility = new ChunkingUtility();

          if(post.T) {
           postModel.TripCode = cu.GetMd5(postModel.SendingAddress).toString();
           postModel.T = true;
          }

          postModel.IPFSHash = post.IPFSHash;
          postModel.Tx = unfilteredResults[i].id;
          postModel.Msg = post.Msg;
          postModel.Title = post.Title
          postModel.Name = post.Name;
          postModel.Parent = post.Parent;
          postModel.ETH = post.ETH;
          postModel.Enc = post.Enc;
          postModel.Timestamp = new Date(unfilteredResults[i].outcome.timestamp);
          
          if(post.F && post.F.length > 0) {
            postModel.F = post.F.toLowerCase();
          }
          postModel.Country = cu.GetCountryFromCode(postModel.F);
          postModel.SubpostTx = post.SubpostTx;
          if(!post.UID || post.UID.length == 0) {
            if(postModel.Timestamp < new Date(2019,7,26)) {
              postModel.UID = 'IDs don\'t exist for posts before 8/24/19';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';
            } else {
              postModel.UID = 'jvl83kq';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';   
            }
          } else {
            postModel.UID = post.UID
            const cu: ChunkingUtility = new ChunkingUtility()
            postModel.BackgroundColor = '#' +  cu.GetColorCodeFingerPrint(postModel.UID);
            postModel.FontColor = cu.InvertColor(postModel.BackgroundColor);
          }
          if(post.IPFSHash && post.IPFSHash.length > 0 && (postModel.Tx === parent || postModel.Parent === parent)) {
            imageCounter++;
            postModel.HasImage = true;
            if(this.Config.ShowImages && !post.Enc) {
              // postModel.Image = await this.getImageBlobFromIPFSHash(post.IPFSHash); 
              // postModel.CreateImageFromBlob();
              postModel.ImageLoading = true;
              this.getImageBlobFromIPFSHash(postModel).then(res=> {
                postModel.Image = res; 
                postModel.CreateImageFromBlob();
                postModel.ImageLoading = false;
              });
            }
          }
          
          if(postModel.Tx === parent || postModel.Parent === parent) {
            postSet.push(postModel);
          }
          allPosts.push(postModel);
        }
      }

      for (let i = 0; i < postSet.length; i++) {
        const curPost = postSet[i];

        if (curPost.SubpostTx && curPost.SubpostTx.length > 0){
          for (let j = 0; j < subPosts.length; j++) {
            if (curPost.SubpostTx === subPosts[j].Tx) {
              curPost.Msg = curPost.Msg + subPosts[j].Msg;
            }
          }
        }

        curPost.Msg = this.decodeURIC(curPost.Msg);

        if(!curPost.Parent || curPost.Parent.length === 0) {
          const newThread: IndImmChanThread = new IndImmChanThread();
          newThread.IndImmChanPostModelParent = curPost;
          retSet.push(newThread);
        } else {
          childSet.push(curPost);
        }
      }

      for (let i = 0; i < childSet.length; i++) {
        const curPost = childSet[i];
        for (let j = 0; j < retSet.length; j++) {
          const parentId = retSet[j].IndImmChanPostModelParent.Tx;
          if (curPost.Parent === parentId) {
            retSet[j].IndImmChanPostModelChildren.push(curPost);
          }
        }
      }
      retSet[0].ImageReplies = imageCounter;
      retSet[0].TotalReplies = retSet[0].IndImmChanPostModelChildren.length;
      retSet[0].AllPosts = allPosts;
      return retSet[0];
  }

  public async GetPostsForPostViewerPartial(parent: string, unfilteredResultsUnModded: any[]): Promise<IndImmChanThread> {
    await this.IndImmChanPostService.rippleService.ForceConnectIfNotConnected();
    while (!this.IndImmChanPostService.rippleService.Connected) {
      await this.IndImmChanPostService.chunkingUtility.sleep(1000);
    }
    const minLedger = 49187118;
    const max = this.IndImmChanPostService.rippleService.maxLedgerVersion;
    let imageCounter = 1;

    //const unfilteredResultsUnModded: any[] = await this.IndImmChanPostService.rippleService.api.getTransactions(boardAddress,
    //  {minLedgerVersion: minLedger, maxLedgerVersion: max});

      const unfilteredResults = await this.RemoveFlaggedPost(unfilteredResultsUnModded);
      const postSet: IndImmChanPostModel[] = [];
      const retSet: IndImmChanThread[] = [];
      const childSet: IndImmChanPostModel[] = [];
      const subPosts: SubPost[] = [];
      const allPosts: IndImmChanPostModel[] = [];

      for (let i = 0; i < unfilteredResults.length; i++) {
        if ('memos' in unfilteredResults[i].specification) {
          try {
            if(unfilteredResults[i].specification.memos[0].type === 'submsg') {
              const subPostToParse = unfilteredResults[i].specification.memos[0].data;
              let subPost: SubPost  = JSON.parse(subPostToParse);
              subPost.Tx = unfilteredResults[i].id;
              subPosts.push(subPost);
              continue;
            }
          } catch(error) {
            // console.log(error);
            continue;
          }
          let post: IndImmChanPost  = null;

          try {
            const dataToParse = unfilteredResults[i].specification.memos[0].data;
            post  = JSON.parse(dataToParse);

            if (post.Name.length === 0) {
              continue;
            }
          } catch (error) {
            // console.log(error);
            continue;
          }

          const postModel: IndImmChanPostModel = new IndImmChanPostModel();
          
          postModel.SendingAddress = unfilteredResults[i].address;
          const cu: ChunkingUtility = new ChunkingUtility();

          if(post.T) {
           postModel.TripCode = cu.GetMd5(postModel.SendingAddress).toString();
           postModel.T = true;
          }

          postModel.IPFSHash = post.IPFSHash;
          postModel.Tx = unfilteredResults[i].id;
          postModel.Msg = post.Msg;
          postModel.Title = post.Title
          postModel.Name = post.Name;
          postModel.Parent = post.Parent;
          postModel.ETH = post.ETH;
          postModel.Enc = post.Enc;
          postModel.Timestamp = new Date(unfilteredResults[i].outcome.timestamp);
          
          if(post.F && post.F.length > 0) {
            postModel.F = post.F.toLowerCase();
          }
          postModel.Country = cu.GetCountryFromCode(postModel.F);
          postModel.SubpostTx = post.SubpostTx;
          if(!post.UID || post.UID.length == 0) {
            if(postModel.Timestamp < new Date(2019,7,26)) {
              postModel.UID = 'IDs don\'t exist for posts before 8/24/19';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';
            } else {
              postModel.UID = 'jvl83kq';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';   
            }
          } else {
            postModel.UID = post.UID
            const cu: ChunkingUtility = new ChunkingUtility()
            postModel.BackgroundColor = '#' +  cu.GetColorCodeFingerPrint(postModel.UID);
            postModel.FontColor = cu.InvertColor(postModel.BackgroundColor);
          }
          if(post.IPFSHash && post.IPFSHash.length > 0 && (postModel.Tx === parent || postModel.Parent === parent)) {
            imageCounter++;
            postModel.HasImage = true;
            if(this.Config.ShowImages && !post.Enc) {
              // postModel.Image = await this.getImageBlobFromIPFSHash(post.IPFSHash); 
              // postModel.CreateImageFromBlob();
              postModel.ImageLoading = true;
              this.getImageBlobFromIPFSHash(postModel).then(res=> {
                postModel.Image = res; 
                postModel.CreateImageFromBlob();
                postModel.ImageLoading = false;
              });
            }
          }
          
          if(postModel.Tx === parent || postModel.Parent === parent) {
            postSet.push(postModel);
          }
          allPosts.push(postModel);
        }
      }

      for (let i = 0; i < postSet.length; i++) {
        const curPost = postSet[i];

        if (curPost.SubpostTx && curPost.SubpostTx.length > 0){
          for (let j = 0; j < subPosts.length; j++) {
            if (curPost.SubpostTx === subPosts[j].Tx) {
              curPost.Msg = curPost.Msg + subPosts[j].Msg;
            }
          }
        }

        curPost.Msg = this.decodeURIC(curPost.Msg);

        if(!curPost.Parent || curPost.Parent.length === 0) {
          const newThread: IndImmChanThread = new IndImmChanThread();
          newThread.IndImmChanPostModelParent = curPost;
          retSet.push(newThread);
        } else {
          childSet.push(curPost);
        }
      }

      for (let i = 0; i < childSet.length; i++) {
        const curPost = childSet[i];
        for (let j = 0; j < retSet.length; j++) {
          const parentId = retSet[j].IndImmChanPostModelParent.Tx;
          if (curPost.Parent === parentId) {
            retSet[j].IndImmChanPostModelChildren.push(curPost);
          }
        }
      }
      retSet[0].ImageReplies = imageCounter;
      retSet[0].TotalReplies = retSet[0].IndImmChanPostModelChildren.length;
      retSet[0].AllPosts = allPosts;
      return retSet[0];
  }


  
  public async GetPostsWrapper(boardAddress: string, minLedger: number, maxLedger: number, index: number): Promise<Array<object>> {
    console.log(new Date().toLocaleString() + ':' + minLedger + '-' + maxLedger + ': STARTED');
    
    const apiInstance = await this.IndImmChanPostService.rippleService.GetApiInstance(index);
    
    const ret = await apiInstance.getTransactions(boardAddress,
      {minLedgerVersion: minLedger, maxLedgerVersion: maxLedger});
    console.log(new Date().toLocaleString() + ':' + minLedger + '-' + maxLedger + ': COMPLETED');
    this.LoadingCalculatorService.IncrementCallInstanceComplete();

      return new Promise<Array<object>>((resolve) => {
        resolve(ret);
    });
  }

  public async GetPostsForCatalog(boardAddress: string): Promise<IndImmChanThread[]> {
    const retSet: IndImmChanThread[] = [];

    //original ledger for blockchan: const minLedger = 49187118;
    const minLedger = 49187118;
    const maxLedger = this.IndImmChanPostService.rippleService.maxLedgerVersion;
    //const numberOfPostsPerCall = 130000;
    const numberOfPostsPerCall = 15000;
    let countOfPingsToServer = 0;
    let trueCountsOfPingToServer = 0;

    for (let i = minLedger; i <= maxLedger; i = i + numberOfPostsPerCall) {
      trueCountsOfPingToServer++;
    }

    this.LoadingCalculatorService.StartLoading(trueCountsOfPingToServer);

    const promisesToExeccute: Promise<any>[] = [];

    for (let i = minLedger; i <= maxLedger; i = i + numberOfPostsPerCall) {
      countOfPingsToServer++;
        if (i + numberOfPostsPerCall > maxLedger) {
          let promise = this.GetPostsWrapper(boardAddress,  i + 1, maxLedger, countOfPingsToServer);
            promisesToExeccute.push(promise);
        }
        else {
          let promise = this.GetPostsWrapper(boardAddress,i + 1, i + numberOfPostsPerCall, countOfPingsToServer);
            promisesToExeccute.push(promise);
        }
        
        if(countOfPingsToServer == 3) {
          countOfPingsToServer = 0;
        }
        console.log(new Date().toLocaleString() + ':' + (i+1) + '-' + (i + numberOfPostsPerCall));
        
    }
    
    const startTimOfExecution = new Date().toLocaleString();

    let results = await Promise.all(promisesToExeccute);

    const endTimeOfExecution = new Date().toLocaleString();


    results.forEach(res=>{
      res.forEach(item=>{
        retSet.push(item);
      });
    });
    var finalResult =  await this.GetPostsForCatalogPartial(retSet);
    const endTimeOfMoldingResults = new Date().toLocaleString();

    console.log('startTimOfExecution: ' + startTimOfExecution);
    console.log('endTimeOfExecution: ' + endTimeOfExecution);
    console.log('endTimeOfMoldingResults: ' + endTimeOfMoldingResults);

    return finalResult;
  }

  public async GetPostsForPostViewer(boardAddress: string, parent: string): Promise<IndImmChanThread> {
    const retSet: IndImmChanThread[] = [];

    //original ledger for blockchan: const minLedger = 49187118;
    const minLedger = 49187118;
    const maxLedger = this.IndImmChanPostService.rippleService.maxLedgerVersion;
    //const numberOfPostsPerCall = 130000;
    const numberOfPostsPerCall = 15000;
    let countOfPingsToServer = 0;
    let trueCountsOfPingToServer = 0;

    for (let i = minLedger; i <= maxLedger; i = i + numberOfPostsPerCall) {
      trueCountsOfPingToServer++;
    }

    this.LoadingCalculatorService.StartLoading(trueCountsOfPingToServer);

    const promisesToExeccute: Promise<any>[] = [];

    for (let i = minLedger; i <= maxLedger; i = i + numberOfPostsPerCall) {
      countOfPingsToServer++;
        if (i + numberOfPostsPerCall > maxLedger) {
          let promise = this.GetPostsWrapper(boardAddress,  i + 1, maxLedger, countOfPingsToServer);
            promisesToExeccute.push(promise);
        }
        else {
          let promise = this.GetPostsWrapper(boardAddress,i + 1, i + numberOfPostsPerCall, countOfPingsToServer);
            promisesToExeccute.push(promise);
        }
        
        if(countOfPingsToServer == 3) {
          countOfPingsToServer = 0;
        }
        console.log(new Date().toLocaleString() + ':' + (i+1) + '-' + (i + numberOfPostsPerCall));
        
    }
    
    const startTimOfExecution = new Date().toLocaleString();

    let results = await Promise.all(promisesToExeccute);

    const endTimeOfExecution = new Date().toLocaleString();


    results.forEach(res=>{
      res.forEach(item=>{
        retSet.push(item);
      });
    });
    var finalResult =  await this.GetPostsForPostViewerPartial(parent, retSet);
    const endTimeOfMoldingResults = new Date().toLocaleString();

    console.log('startTimOfExecution: ' + startTimOfExecution);
    console.log('endTimeOfExecution: ' + endTimeOfExecution);
    console.log('endTimeOfMoldingResults: ' + endTimeOfMoldingResults);

    return finalResult;
  }


  public async GetPostsForCatalogPartial(unfilteredResultsUnModded: any[]): Promise<IndImmChanThread[]> {
    await this.IndImmChanPostService.rippleService.ForceConnectIfNotConnected();
    while (!this.IndImmChanPostService.rippleService.Connected) {
      await this.IndImmChanPostService.chunkingUtility.sleep(1000);
    }
    //const minLedger = this.IndImmChanPostService.rippleService.earliestLedgerVersion;

    /*const unfilteredResultsUnModded: any[] = await this.IndImmChanPostService.rippleService.api.getTransactions(boardAddress,
      {minLedgerVersion: minLedger, maxLedgerVersion: maxLedger});*/

      const unfilteredResults = await this.RemoveFlaggedPost(unfilteredResultsUnModded);

      const postSet: IndImmChanPostModel[] = [];
      const retSet: IndImmChanThread[] = [];
      const childSet: IndImmChanPostModel[] = [];
      const subPosts: SubPost[] = [];

      for (let i = 0; i < unfilteredResults.length; i++) {
        if ('memos' in unfilteredResults[i].specification) {
          try {
            if(unfilteredResults[i].specification.memos[0].type === 'submsg') {
              const subPostToParse = unfilteredResults[i].specification.memos[0].data;
              let subPost: SubPost  = JSON.parse(subPostToParse);
              subPost.Tx = unfilteredResults[i].id;
              subPosts.push(subPost);
              continue;
            }
          } catch(error) {
            // console.log(error);
            continue;
          }
          let post: IndImmChanPost = null;
          try {
            const dataToParse = unfilteredResults[i].specification.memos[0].data;
            post  = JSON.parse(dataToParse);

            if (post.Name.length === 0) {
              continue;
            }
          } catch (error) {
            // console.log(error);
            continue;
          }
          const postModel: IndImmChanPostModel = new IndImmChanPostModel();
          postModel.IPFSHash = post.IPFSHash;
          postModel.Tx = unfilteredResults[i].id;
          postModel.Msg = post.Msg;
          postModel.Title = post.Title
          postModel.Name = post.Name;
          postModel.Parent = post.Parent;
          postModel.Enc = post.Enc;
          postModel.T = post.T;
          postModel.Timestamp = new Date(unfilteredResults[i].outcome.timestamp);

          if(post.F && post.F.length > 0) {
            postModel.F = post.F.toLowerCase();
          }

          postModel.SubpostTx = post.SubpostTx;
          postModel.SendingAddress = unfilteredResults[i].address;
          const cuf: ChunkingUtility = new ChunkingUtility();
          postModel.Country = cuf.GetCountryFromCode(postModel.F);

          if(post.T) {
            const cu: ChunkingUtility = new ChunkingUtility();
            postModel.TripCode = cu.GetMd5(postModel.SendingAddress).toString();
            postModel.T = true;
           }
          if(!post.UID || post.UID.length == 0) {
            if(postModel.Timestamp < new Date(2019,7,26)) {
              postModel.UID = 'IDs don\'t exist for posts before 8/24/19';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';
            } else {
              postModel.UID = 'jvl83kq';
              postModel.BackgroundColor = '#cc0000';
              postModel.FontColor = '#ffffff';   
            }
          } else {
            postModel.UID = post.UID
            const cu: ChunkingUtility = new ChunkingUtility()
            postModel.BackgroundColor = '#' +  cu.GetColorCodeFingerPrint(postModel.UID);
            postModel.FontColor = cu.InvertColor(postModel.BackgroundColor);
          }
          
          postModel.ETH = post.ETH;
          if(post.IPFSHash && post.IPFSHash.length > 0) {
            postModel.HasImage = true;
              if(!postModel.Parent || postModel.Parent.length === 0) {
                if(this.Config.ShowImages && !post.Enc) {
                  // postModel.Image = await this.getImageBlobFromIPFSHash(post.IPFSHash); 
                  // postModel.CreateImageFromBlob();
                  postModel.ImageLoading = true;
                  this.getImageBlobFromIPFSHash(postModel).then(res=> {
                    postModel.Image = res; 
                    postModel.CreateImageFromBlob();
                    postModel.ImageLoading = false;
                  });
                }
            }
          }
          postSet.push(postModel);
        }
      }

      for (let i = 0; i < postSet.length; i++) {
        const curPost = postSet[i];

        if (curPost.SubpostTx && curPost.SubpostTx.length > 0){
          for (let j = 0; j < subPosts.length; j++) {
            if (curPost.SubpostTx === subPosts[j].Tx) {
              curPost.Msg = curPost.Msg + subPosts[j].Msg;
            }
          }
        }
        curPost.Msg = this.decodeURIC(curPost.Msg);

        if(!curPost.Parent || curPost.Parent.length === 0) {
          const newThread: IndImmChanThread = new IndImmChanThread();
          if(curPost.Tx ==='7F9444A0342349AF997EEC992F1121462190242A532773C244B6BB80B0B4EA27') {
            curPost.EncDemo = true;
          }
          newThread.IndImmChanPostModelParent = curPost;
          retSet.push(newThread);
        } else {
          childSet.push(curPost);
        }
      }




      for (let i = 0; i < childSet.length; i++) {
        const curPost = childSet[i];
        for (let j = 0; j < retSet.length; j++) {
          const parentId = retSet[j].IndImmChanPostModelParent.Tx;
          if (curPost.Parent === parentId) {
            if(curPost.IPFSHash && curPost.IPFSHash.length > 0) {
              retSet[j].ImageReplies++;
            }
            retSet[j].TotalReplies++;
            retSet[j].IndImmChanPostModelChildren.push(curPost);
          }
        }
      }
  
      this.Config.LastUpdateTime = new Date();
      return retSet;
  }

  public async ManualOverRideShowImage(post: IndImmChanPostModel): Promise<IndImmChanPostModel> {
    if (post && !post.ShowImageOverride) {
      post.ImageLoading = true;
      const blob = await this.IndImmChanPostService.getFromIPFS(post.IPFSHash);    
      post.Image = blob;
      post.CreateImageFromBlob();
      post.ShowImageOverride = true;
      post.ImageLoading = false;
      return post; 
    } else {
      return post;
    }
  }

  public async ManualOverRideShowImageFromRefresh(post: IndImmChanPostModel): Promise<IndImmChanPostModel> {
    if (post) {
      post.ImageLoading = true;
      const blob = await this.IndImmChanPostService.getFromIPFS(post.IPFSHash);    
      post.Image = blob;
      post.CreateImageFromBlob();
      post.ShowImageOverride = true;
      post.ImageLoading = false;
      return post; 
    } else {
      return post;
    }
  }

  public async ManualOverRideHideImages(post: IndImmChanPostModel) {
    if(post) {
      try {
        post.ImageLoading = false;
        post.Image = null;
        post.ShowImageOverride = false;
        post.ImageLoading = false;
        post.Base64Image = null;
        return post;
      } catch (error) {
        // console.log(error);
        return post;
      } 
    } else {
      return post;
    }
  }

  public async getImageBlobFromIPFSHash(post: IndImmChanPost) {
    const result = this.IndImmChanPostService.getFromIPFS(post.IPFSHash);      
    return result;   
  }
  
  decodeURIC(str: string) {
    try {
      return decodeURI(str); //.replace(/%0[89AD]/gi, '')).replace(/%0/g, '');
    } catch (error) {
      // console.log(error);
      // console.log(str);
      return str;
    }
  }
}
