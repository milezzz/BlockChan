import { Component, OnInit } from '@angular/core';
import {Buffer} from 'buffer';
import { IndImmChanPostService } from '../ind-imm-chan-post.service';
import { map, filter, switchMap } from 'rxjs/operators';
import { IndImmChanPost } from '../ind-imm-chan-post';
import { IndImmChanPostManagerService } from '../ind-imm-chan-post-manager.service';
import { IndImmChanAddressManagerService } from '../ind-imm-chan-address-manager.service';
import { IndImmChanPostModel } from '../ind-imm-chan-post-model';
import { IndImmChanThread } from '../ind-imm-chan-thread';
import { ActivatedRoute, UrlTree } from '@angular/router';
import {Router} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ChunkingUtility } from '../chunking-utility';
import { IndImmConfigService } from '../ind-imm-config.service';
import { GlobalEventService } from '../global-event.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ConfirmEncryptPostComponent } from '../confirm-encrypt-post/confirm-encrypt-post.component';
import { PostKey } from '../post-key';
import { CreateFileDetailTransactionChainResponse } from '../create-file-detail-transaction-chain-response';
import { Meta } from '@angular/platform-browser';
import {Title} from '@angular/platform-browser';
import { FlagService } from '../flag.service';
import { BlockChanHostSettingsService } from '../block-chan-host-settings.service';
import { LoadingCalculatorService } from '../loading-calculator.service';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { CreateBoard } from '../create-board';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  AddressManagerService: IndImmChanAddressManagerService;
  IndImmChanPostManagerService: IndImmChanPostManagerService;
  GlobalEventService: GlobalEventService;
  LoadingCalculatorService: LoadingCalculatorService;
  Route: ActivatedRoute
  ToastrService: ToastrService;
  Config: IndImmConfigService;
  BlockChanHostingService: BlockChanHostSettingsService;
  Meta: Meta;
  Title: Title;

  IsUserCreatedBoard = false;
  UserCreatedBoardReference: CreateBoard;

  HeaderImage = '';
  postBoardName = '';
  postTitle = '';
  postMessage = '';
  postBoard  = '';
  posterName = 'Anonymous';
  fileToUpload: File = null;
  resultImage: any = null;
  parentTx = '';
  threads: IndImmChanThread[] = null;
  Router: Router;
  PostLoading = false;
  Posting = false;
  PostingError = false;
  PostingEnabled = true;
  PostingSecondsLeftCounter = 0;
  ShowPostingForm = false;
  PostIsEncrypted = false;
  EncryptedKey:PostKey;
  Dialog: MatDialog;
  EthTipAddress = '';
  TripAddress = '';
  TripSecret = '';
  TripName = '';
  ShowTripEntry = false;
  search = '';
  ShowSearch = false;
  FlagService: FlagService;

  ToggleShowSearch() {
    this.ShowSearch = true;
  }
  ToggleHideSearch() {
    this.ShowSearch = false;
  }

  constructor(indImmChanPostManagerService: IndImmChanPostManagerService, indImmChanAddressManagerService: IndImmChanAddressManagerService,
    route: ActivatedRoute, router:Router, toasterService: ToastrService, globalEventService: GlobalEventService, config: IndImmConfigService,
    dialog: MatDialog, meta: Meta, title: Title, flagService: FlagService, blockChanHostingService: BlockChanHostSettingsService,
    loadingCalculatorService: LoadingCalculatorService) {
      this.Dialog = dialog;
      this.Config = config;
      this.Route = route;
      this.IndImmChanPostManagerService = indImmChanPostManagerService;
      this.AddressManagerService = indImmChanAddressManagerService;
      this.Router = router;
      this.ToastrService = toasterService;
      this.GlobalEventService = globalEventService;
      this.BlockChanHostingService = blockChanHostingService;
      this.GlobalEventService.EnableModeration.subscribe(state => {
        this.refresh(false);
      });
      
      this.LoadingCalculatorService = loadingCalculatorService;

      this.Meta = meta;
      this.Title = title;

      this.GlobalEventService.ShowImagesToggled.subscribe(state=>{

        if(state) {
          this.showImagesFromToggle()
        } else {
          this.hideImagesFromToggle();
        }
      });
  
      this.FlagService = flagService;
      const cu: ChunkingUtility = new ChunkingUtility();
      this.setBoardNameWrapper();
    }

    public dropped(files: NgxFileDropEntry[]) {
      if(files.length > 1) {
        this.ToastrService.error('You can only upload one file at a time', 'Upload Error');
        return;
      }

      for (const droppedFile of files) {
        // Is it a file?
        if (droppedFile.fileEntry.isFile) {
          const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
          fileEntry.file((file: File) => {
            this.fileToUpload = file;
            console.log('Drag and drop file loaded');
          });
        }
      }
    }
  
   
    public fileOver(event){
      console.log(event);
    }
   
    public fileLeave(event){
      console.log(event);
    }

    filterCatalog(event) {
      console.log(event);
      for (let i = 0; i < this.threads.length; i++) {
        if (event === '') {
          this.threads[i].FilteredBySearch = false;
        } else {
          if(this.threads[i].IndImmChanPostModelParent.Title.toLowerCase().includes(event.toLowerCase())) {
            this.threads[i].FilteredBySearch = false;       
          } else if (this.threads[i].IndImmChanPostModelParent.Msg.toLowerCase().includes(event.toLowerCase())) {
            this.threads[i].FilteredBySearch = false;            
          }
          else {
            this.threads[i].FilteredBySearch = true;
          }
        }
      }
    }

    sortThreadsFromConfig() {
      let configFromMemory = JSON.parse(localStorage.getItem('Config'));
      if(configFromMemory) {
        this.Config.Sort = configFromMemory.Sort;
        // console.log('config sort1: ' + this.Config.Sort);

      }
      if (this.threads && this.threads.length > 0) {
        if (!this.Config.Sort || this.Config.Sort === '') {
          //console.log('null sort');
          this.sortThreads('LastReply');
        } else {
        this.sortThreads(this.Config.Sort);
        //console.log('config sort: ' + this.Config.Sort);
        }
      } else {
        //console.log('no threads');
      }
    }

    sortThreads(sort) {
      if (sort === 'LastReply') {
        this.threads.sort(this.sortLastReply);
      } else if  (sort === 'CreateDate') {
        this.threads.sort(this.sortCreationDate);
      } else if  (sort === 'ReplyCount') {
        this.threads.sort(this.sortReplies);
      }
      this.Config.Sort = sort;
      try{ 
        localStorage.setItem('Config', JSON.stringify(this.Config));
      } catch (error) {
        console.log('Storage out of space more than likely, work around coming');
      }
    }

    AddTrip() {
      this.ShowTripEntry = true;
    }
    OpenPostInNewWindows(thread:IndImmChanThread) {
      let url: UrlTree = null;

      if (this.BlockChanHostingService.IsHostedOnGithub) {
        url = this.Router.createUrlTree([this.BlockChanHostingService.GitHubRepo + '/postViewer/' + this.postBoard + '/' + thread.IndImmChanPostModelParent.Tx]);
      } else {
        url = this.Router.createUrlTree(['postViewer/' + this.postBoard + '/' + thread.IndImmChanPostModelParent.Tx]);
      }
      
      try {
        localStorage.setItem('thread-' + thread.IndImmChanPostModelParent.Tx, JSON.stringify(thread));
      } catch (error) {
        console.log('Storage out of space more than likely, work around coming');
      }

      window.open(url.toString(), '_blank');
    }
  
    OpenPolitics() {
      this.selfInit('pol');
    }
  
    OpenBusiness() {
      this.selfInit('biz');
    }
  
    OpenRandom() {
      this.selfInit('b');
    }

    OpenMeta() {
      this.selfInit('m');
    }

    OpenTechnology() {
      this.selfInit('g');
    }

    OpenWeapons() {
      this.selfInit('k');
    }

    OpenAnime() {
      this.selfInit('a');
    }

    OpenLit() {
      this.selfInit('lit');
    }

    
    OpenCon() {
      this.selfInit('con');
    }

    
    OpenV() {
      this.selfInit('v');
    }

    
    OpenMis() {
      this.selfInit('mis');
    }

    
    OpenInt() {
      this.selfInit('int');
    }

    
  async ConfirmEncryption() {
    const dialogRef = this.Dialog.open(ConfirmEncryptPostComponent, {
      width: '650px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        this.EncryptedKey = result;
        this.PostIsEncrypted = true;

        const cu:ChunkingUtility = new ChunkingUtility();

        const origValue = 'test';
        console.log('origValue: ' + origValue);

        const enc = await cu.EncryptMessage(origValue, this.EncryptedKey.Key,this.EncryptedKey.IVAsUint8);
        console.log('Enc: ' + enc);

        const dec = await await cu.DecryptMessage(enc,this.EncryptedKey.Key, this.EncryptedKey.IV);
        console.log('dec: ' + dec);

      } else {
        this.PostIsEncrypted = false;
      }
    });
  } 

  async showImagesFromToggle() {
    for (let i = 0; i < this.threads.length; i++) {
      if(!this.threads[i].IndImmChanPostModelParent.Enc) {
        this.IndImmChanPostManagerService.ManualOverRideShowImage(this.threads[i].IndImmChanPostModelParent).then(result=>{
          this.threads[i].IndImmChanPostModelParent = result;
        });
    }
    }
  }

  async hideImagesFromToggle() {
    for (let i = 0; i < this.threads.length; i++) {
      this.IndImmChanPostManagerService.ManualOverRideHideImages(this.threads[i].IndImmChanPostModelParent).then(result=>{
        this.threads[i].IndImmChanPostModelParent = result;
      });          
    }
  }

  togglePostingForm() {
    this.ShowPostingForm = !this.ShowPostingForm;
  }

  public async blockPosting() {
    this.PostingEnabled = false;
    this.PostingSecondsLeftCounter = 60;
    const cu: ChunkingUtility = new ChunkingUtility();

    for(let i = 0; i < 60; i++) {
      this.PostingSecondsLeftCounter--;
      await cu.sleep(1000);
    }
    this.PostingSecondsLeftCounter = 0;
    this.PostingEnabled = true;
  }

  async refresh(silent: boolean) {

    await this.setBoardNameWrapper();

    if(!silent) {
      this.PostLoading = true;
    }

    while (!this.IndImmChanPostManagerService.IndImmChanPostService.rippleService.Connected) {
      await this.IndImmChanPostManagerService.IndImmChanPostService.chunkingUtility.sleep(1000);
    }
    
    let boardAddress = '';
    let modAddress = '';
    if(this.IsUserCreatedBoard) {
      boardAddress = this.UserCreatedBoardReference.BoardXRPAddress;
      modAddress = this.UserCreatedBoardReference.BoardsModXRPAddress;
    } else {
      boardAddress = this.AddressManagerService.GetBoardAddress(this.postBoard);
    }

    const threads = await this.IndImmChanPostManagerService.GetPostsForCatalog(boardAddress, modAddress);
    for (let i = 0; i < threads.length; i++) {
      threads[i].Prep(this.BlockChanHostingService.BaseUrl);
    }

    // threads.sort(this.sortLastReply);
    this.threads = threads;
    this.sortThreadsFromConfig();

    this.PostLoading = false;
    try {
         localStorage.setItem(this.postBoard, JSON.stringify(this.threads)); 
    } catch (error) {
      console.log('Storage out of space more than likely, work around coming');
    }

  }
  
  public handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  async post() {
    if (!this.fileToUpload) {
      this.ToastrService.error('Must include a file.', 'Posting Error');
      return;
    }
    if (this.fileToUpload.size > 4400000) {
      this.ToastrService.error('File must be below 4 Megs', 'Posting Error');
      return;
    }
    if (!(this.fileToUpload.type === 'image/jpeg' ||
      this.fileToUpload.type === 'image/gif' ||
      this.fileToUpload.type === 'video/webm' ||
      this.fileToUpload.type === 'image/png')) {
        this.ToastrService.error('File must be of type Jpeg, Gif, PNG, or Webm', 'Posting Error');
        return;
    }
    if (this.postMessage.length > 1320) {
      this.ToastrService.error('Message must be less than 1320 characters.', 'Posting Error');
      return;
    }
    if (this.postMessage.length === 0) {
      this.ToastrService.error('Message must not be empty', 'Posting Error');
      return;
    }
    if (this.postTitle.length === 0) {
      this.ToastrService.error('Title must not be empty', 'Posting Error');
      return;
    }
    if (this.postTitle.length> 80) {
      this.ToastrService.error('Title must be less than 80 characters.', 'Posting Error');
      return;
    }

    let useTrip = false;

    if(this.TripAddress.length > 0 || this.TripSecret.length > 0) {
      const tripValid = await this.IndImmChanPostManagerService.IndImmChanPostService.rippleService.IsSenderSecretValid(this.TripAddress, this.TripSecret);
      if (tripValid) {
        useTrip = true;
        this.IndImmChanPostManagerService.IndImmChanPostService.TripKey = this.TripAddress;
        this.IndImmChanPostManagerService.IndImmChanPostService.TripSecret = this.TripSecret;
        this.IndImmChanPostManagerService.IndImmChanPostService.TripValid = true;
      } else {
        this.ToastrService.error('Invalid secret/key', 'Error');
        return;
      }
    } else {
      this.IndImmChanPostManagerService.IndImmChanPostService.TripKey = '';
      this.IndImmChanPostManagerService.IndImmChanPostService.TripSecret = '';
      this.IndImmChanPostManagerService.IndImmChanPostService.TripValid = false;
    }
    
    if(!this.ShowTripEntry) {
      this.posterName = 'Anonymous';
    }
    
    this.Posting = true;

    try {

      let forceXRPDestinationAddress = '';
      if (this.IsUserCreatedBoard) {
        forceXRPDestinationAddress = this.UserCreatedBoardReference.BoardXRPAddress;
      }

      this.blockPosting();
      const tx = await this.IndImmChanPostManagerService.post(this.postTitle, this.postMessage, this.posterName, this.fileToUpload, this.postBoard,
          this.parentTx, this.EncryptedKey, this.EthTipAddress, useTrip, await this.FlagService.GetFlag(), forceXRPDestinationAddress);
      this.PostingError = false;
      this.Router.navigate(['/postViewer/' + this.postBoard + '/' + tx.TX]);
      // this.refresh();
    } catch (error) {
      console.log(error);
      this.PostingError = true;
      this.PostingEnabled = true;
    }  
    this.Posting = false;
  }
  
  async OpenThread(thread: IndImmChanThread){
    try {
      localStorage.setItem('thread-' + thread.IndImmChanPostModelParent.Tx, JSON.stringify(thread));
    } catch (error) {
      console.log('Storage out of space more than likely, work around coming');
    }
    this.Router.navigate(['/postViewer/' + this.postBoard + '/' + thread.IndImmChanPostModelParent.Tx]);

  }

  async setBoardName() {
    if (this.postBoard === 'pol') {
      this.postBoardName = 'Politically Incorrect';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'biz') {
      this.postBoardName = 'Business';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'b') {
      this.postBoardName = 'Random';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'm') {
      this.postBoardName = 'Meta';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'a') {
      this.postBoardName = 'Anime';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'k') {
      this.postBoardName = 'Weapons';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'g') {
      this.postBoardName = 'Technology';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'lit') {
      this.postBoardName = 'Literature';
      this.IsUserCreatedBoard = false;
    }  else if (this.postBoard === 'con') {
      this.postBoardName = 'Conspiracy';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'v') {
      this.postBoardName = 'Video Games';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'mis') {
      this.postBoardName = 'Mission Planning';
      this.IsUserCreatedBoard = false;
    } else if (this.postBoard === 'int') {
      this.postBoardName = 'International';
      this.IsUserCreatedBoard = false;
    } else {
      const userCreatedBoards = await this.IndImmChanPostManagerService.GetUserCreatedBoardList();
      userCreatedBoards.forEach(b=> {
        if(this.postBoard == b.BoardAddress) {
          this.UserCreatedBoardReference = b;
          this.postBoardName = b.BoardName;
          this.IsUserCreatedBoard = true;
        }
      })
    }
  }

  async setBoardNameWrapper() {
    await this.setBoardName();
    await this.loadHeaderImage(this.postBoard);

  }

  async loadHeaderImage(boardName: string) {
      if (this.IsUserCreatedBoard) {
        this.HeaderImage = 'assets/images/headers/' + 'pol' + '-1.jpg';
      } else {
        this.HeaderImage = 'assets/images/headers/' + boardName+ '-1.jpg';
      }        
  }

  ngOnInit() {  
    this.postBoard = this.Route.snapshot.params['board'];
 
    const cu: ChunkingUtility = new ChunkingUtility();

    const boardString = localStorage.getItem(this.postBoard);
    if(boardString) {
      const threadsFromCache: IndImmChanThread[] = JSON.parse(boardString);

      const populatedThreads: IndImmChanThread[] = [];

      for (let j = 0; j < threadsFromCache.length; j++) {
        const threadBare: IndImmChanThread = threadsFromCache[j];
        const children: IndImmChanPostModel[] = [];

        const parent: IndImmChanPostModel = cu.HydratePostModel(threadBare.IndImmChanPostModelParent);

        let imageCounter = 1;

        for (let i = 0; i < threadBare.IndImmChanPostModelChildren.length; i++) {
          if(threadBare.IndImmChanPostModelChildren[i].HasImage)
          {
            imageCounter++;
          }
          children.push(cu.HydratePostModel(threadBare.IndImmChanPostModelChildren[i]));
        }

        const thread: IndImmChanThread = new IndImmChanThread();
        thread.IndImmChanPostModelParent = parent;
        thread.IndImmChanPostModelChildren = children;

        const newThread:IndImmChanThread = new IndImmChanThread();
        newThread.IndImmChanPostModelChildren = children;
        newThread.IndImmChanPostModelParent = parent;
        newThread.ImageReplies = imageCounter;
        newThread.TotalReplies = children.length;
        populatedThreads.push(newThread);
      }

      for (let i = 0; i < populatedThreads.length; i++) {
        populatedThreads[i].PrepForCache();
      }
      // populatedThreads.sort(this.sortLastReply);

      this.threads = populatedThreads;
      this.sortThreadsFromConfig();



      if(this.Config.ShowImages) {
      this.reloadImages();
      } else {
        this.hideImagesFromToggle();
      }
      
      this.setMeta();
      //this.refresh(true);
    }
    else {
      this.refresh(false);
    }    
  }

  async setMeta() {
    this.Title.setTitle('BlockChan - /' + this.postBoard + '/');

    /*
    this.removeTagIfExists('twitter:card');
    this.removeTagIfExists('twitter:site');
    this.removeTagIfExists('twitter:creator');
    this.removeTagIfExists('twitter:title');
    this.removeTagIfExists('twitter:description');
    this.removeTagIfExists('twitter:image');

    this.Meta.addTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.Meta.addTag({ name: 'twitter:site', content: '@ind_imm' });
    this.Meta.addTag({ name: 'twitter:site', content: '@ind_imm' });
    this.Meta.addTag({ name: 'twitter:title',content:  '/' + this.postBoard + '/ - ' + this.postBoardName });
    this.Meta.addTag({ name: 'twitter:description', content: '/' + this.postBoard + '/ on BlockChan'});
    this.Meta.addTag({ name: 'twitter:image', content: this.HeaderImage });
    */
  }
  
  async reloadImages() {
      for (let i = 0; i < this.threads.length; i++) {
        if (this.threads[i].IndImmChanPostModelParent.IPFSHash && this.threads[i].IndImmChanPostModelParent.IPFSHash.length > 0
          && (!this.threads[i].IndImmChanPostModelParent.Enc)) {
            if(!this.threads[i].IndImmChanPostModelParent.Base64Image) {
              this.threads[i].IndImmChanPostModelParent.ImageLoading = true;
              this.IndImmChanPostManagerService.ManualOverRideShowImageFromRefresh(this.threads[i].IndImmChanPostModelParent).then(result=> {
                this.threads[i].IndImmChanPostModelParent = result;
                this.threads[i].IndImmChanPostModelParent.ImageLoading = false;
            });
          }
        }
      }
    }
  
    
  removeTagIfExists(tag) {
    const tagToRemove = this.Meta.getTag('name=\'' + tag + '\'');
    if(tagToRemove) {
     this.Meta.removeTagElement(tagToRemove);
    }
  }


  selfInit(board) {
    this.postBoard = board;

    this.setBoardNameWrapper();
 
    this.Router.navigate(['/catalog/' + this.postBoard]);

    this.setMeta();
    this.refresh(false);
  }
  async ManualOverRideShowImage(post: IndImmChanPostModel) {
    post.ShowFullSizeFile = false;
    await this.IndImmChanPostManagerService.ManualOverRideShowImage(post);
  }


  sortLastReply( a: IndImmChanThread, b:IndImmChanThread ) {
    if ( a.LastCommentTime < b.LastCommentTime ){
      return 1;
    }
    if ( a.LastCommentTime > b.LastCommentTime ){
      return -1;
    }
    return 0;
  }

  sortCreationDate(a: IndImmChanThread, b:IndImmChanThread) {
    if ( a.IndImmChanPostModelParent.Timestamp < b.IndImmChanPostModelParent.Timestamp ){
      return 1;
    }
    if ( a.IndImmChanPostModelParent.Timestamp > b.IndImmChanPostModelParent.Timestamp ){
      return -1;
    }
    return 0;
  }
  
  sortReplies(a: IndImmChanThread, b:IndImmChanThread) {
    if ( a.TotalReplies< b.TotalReplies ){
      return 1;
    }
    if ( a.TotalReplies > b.TotalReplies ){
      return -1;
    }
    return 0;
  }
  

}
