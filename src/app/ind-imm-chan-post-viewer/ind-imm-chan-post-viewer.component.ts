import { Component, OnInit, ElementRef } from '@angular/core';
import {Buffer} from 'buffer';
import { IndImmChanPostService } from '../ind-imm-chan-post.service';
import { map, filter, switchMap } from 'rxjs/operators';
import { IndImmChanPost } from '../ind-imm-chan-post';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Meta } from '@angular/platform-browser';
import {Title} from '@angular/platform-browser';

import { IndImmChanPostManagerService } from '../ind-imm-chan-post-manager.service';
import { IndImmChanAddressManagerService } from '../ind-imm-chan-address-manager.service';
import { IndImmChanPostModel } from '../ind-imm-chan-post-model';
import { IndImmChanThread } from '../ind-imm-chan-thread';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser'
import { ChunkingUtility } from '../chunking-utility';
import { IndImmConfigService } from '../ind-imm-config.service';
import { GlobalEventService } from '../global-event.service';
import { PostKey } from '../post-key';
import { ETHTipService } from '../ethtip.service';
import { TipDialogComponent } from '../tip-dialog/tip-dialog.component';
import { ModeratorDialogComponent } from '../moderator-dialog/moderator-dialog.component';
import { PostModFlagModel } from '../post-mod-flag-model';
import { PostModFlag } from '../post-mod-flag';
import { FlagService } from '../flag.service';
import { BlockChanHostSettingsService } from '../block-chan-host-settings.service';
import { LoadingCalculatorService } from '../loading-calculator.service';
import { AbstractFormGroupDirective } from '@angular/forms';

@Component({
  selector: 'app-ind-imm-chan-post-viewer',
  templateUrl: './ind-imm-chan-post-viewer-4.component.html',
  styleUrls: ['./ind-imm-chan-post-viewer-4.component.scss']
})

export class IndImmChanPostViewerComponent implements OnInit {
  AddressManagerService: IndImmChanAddressManagerService;
  IndImmChanPostManagerService: IndImmChanPostManagerService;
  LoadingCalculatorService: LoadingCalculatorService;
  Route: ActivatedRoute;
  Router: Router;
  ToastrService: ToastrService;
  Dialog: MatDialog;
  Meta: Meta;
  Title: Title;
  Elem: ElementRef;

  postTitle = '';
  postMessage = '';
  postBoard  = '';
  postBoardName = '';
  posterName = 'Anonymous';
  fileToUpload: File = null;
  resultImage: any = null;
  parentTx = '';
  thread: IndImmChanThread = null;
  PostLoading = false;
  Posting = false;
  PostingError = false;
  Sanitizer: DomSanitizer
  PostingEnabled = true;
  PostingSecondsLeftCounter = 0;
  Config: IndImmConfigService;
  ShowPostingForm = false;
  GlobalEventService: GlobalEventService
  EncryptedKey: PostKey
  Key = '';
  IV = '';
  PostDecrypted = false;
  EthTipService:ETHTipService
  EthTipAddress = '';
  ShowTripEntry = false;
  TripAddress = '';
  TripSecret = '';
  TripName = '';
  HeaderImage = '';
  FlagService: FlagService;
  BlockChanHostSettingsService: BlockChanHostSettingsService;

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

  togglePostingForm() {
    this.ShowPostingForm = !this.ShowPostingForm;
  }
  AddTrip() {
    this.ShowTripEntry = true;
  }
  async decrypt() {
    try {
      const cu: ChunkingUtility = new ChunkingUtility();

      this.decryptPost(this.thread.IndImmChanPostModelParent, true).then(result=>{
        this.thread.IndImmChanPostModelParent = result;
      }).catch(error=>{
        this.ToastrService.error('Error Decrypting Post, plese try again.', 'Decrypt Error');
      });

      for(let i = 0; i < this.thread.IndImmChanPostModelChildren.length; i++) {
        this.decryptPost(this.thread.IndImmChanPostModelChildren[i], false).then(result=>{
          this.thread.IndImmChanPostModelChildren[i] = result;
        });
      }

      const ivAsUint8 = cu.Base64ToUint8(this.IV);      
      this.EncryptedKey = new PostKey()
      this.EncryptedKey.Key = this.Key
      this.EncryptedKey.IVAsUint8 = ivAsUint8;
      this.EncryptedKey.IV = this.IV;
    } catch (error) {
      this.ToastrService.error('Error Decrypting Post, plese try again.', 'Decrypt Error');
    }
  }

  async decryptPost(post: IndImmChanPostModel, isParent: boolean) {
    const origPost = post;
    try {
      const cu: ChunkingUtility = new ChunkingUtility();

      post.Title = await cu.DecryptMessage(post.Title, this.Key, this.IV);
      post.Msg = await cu.DecryptMessage(post.Msg, this.Key, this.IV);
      if(isParent){
        this.PostDecrypted = true;
      }
      if(post.IPFSHash && post.IPFSHash.length > 0) {
        post.IPFSHash = await cu.DecryptMessage(post.IPFSHash, this.Key, this.IV);
        post = await this.IndImmChanPostManagerService.ManualOverRideShowImage(post);
      }

      return post; 
    } catch (error) {
      if(isParent){
        this.ToastrService.error('Error Decrypting Post, plese try again.', 'Decrypt Error');
        this.PostDecrypted = false;
      }
      return origPost;
    }
  }

  async highlightposts(postClass: string) {
    let eles = this.Elem.nativeElement.querySelectorAll('.h' + postClass);
    for (let i = 0; i < eles.length; i++) {    
      if(eles[i].style.background === '') {
        eles[i].style.background = '#8C3726';
        const newHeight = eles[i].parentNode.parentNode.clientHeight;
        
        eles[i].style.minHeight = newHeight + 'px';
        eles[i].style.height = newHeight+ 'px';
        
        //eles[i].style.minHeight = '500px';
        // eles[i].style.height = '500px';
      } else {
        eles[i].style.background  = '';
      }
    }
  }

  async Flag(post:IndImmChanPostModel){
    const dialogRef = this.Dialog.open(ModeratorDialogComponent, {
      width: '525px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (<PostModFlagModel>result) {
        result.Tx = post.Tx;

        const modValid = await this.IndImmChanPostManagerService.IndImmChanPostService.rippleService.IsSenderSecretValid(result.Address, result.Key);

        if(!modValid){
          this.ToastrService.error('Invalid key', 'Error');
        } else {
          const warning: PostModFlag = new PostModFlag();
          warning.Tx = post.Tx;
          warning.Type = result.Type;
          await this.IndImmChanPostManagerService.IndImmChanPostService.postWarningToRipple(warning, result.Address, result.Key, post.IPFSHash);
          this.ToastrService.success('Post will no longer show in moderated client', 'Post flagged');
        }
      } else {
        
      }
    });
  }

  async Tip(post:IndImmChanPostModel){
    const dialogRef = this.Dialog.open(TipDialogComponent, {
      width: '325px',
      panelClass: 'custom-modalbox'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (<number>result) {
        console.log('sending eth');
        this.SendEth(post, result)
      } else {
        
      }
    });
  }

  async SendEth(post:IndImmChanPostModel, amount:number) {
    let testEthToSend = 0.00055;
    await this.EthTipService.send(post.ETH, amount);
  }

  
  OpenLit() {
    this.Router.navigate(['/catalog/lit']);
  }

  
  OpenCon() {
    this.Router.navigate(['/catalog/con']);
  }

  
  OpenV() {
    this.Router.navigate(['/catalog/v']);
  }

  
  OpenMis() {
    this.Router.navigate(['/catalog/mis']);
  }

  
  OpenInt() {
    this.Router.navigate(['/catalog/int']);
  }


  OpenPolitics() {
    this.Router.navigate(['/catalog/pol']);
  }

  OpenBusiness() {
    this.Router.navigate(['/catalog/biz']);
  }

  OpenRandom() {
    this.Router.navigate(['/catalog/b']);
  }

  OpenMeta() {
    this.Router.navigate(['/catalog/m']);
  }

  OpenTechnology() {
    this.Router.navigate(['/catalog/g']);
  }

  OpenWeapons() {
    this.Router.navigate(['/catalog/k']);
  }

  OpenAnime() {
    this.Router.navigate(['/catalog/a']);
  }


  constructor(indImmChanPostManagerService: IndImmChanPostManagerService, indImmChanAddressManagerService: IndImmChanAddressManagerService,
    route: ActivatedRoute, router: Router, toastrSrvice: ToastrService, sanitizer: DomSanitizer, config: IndImmConfigService,
    globalEventService: GlobalEventService, ethTipService:ETHTipService, dialog: MatDialog, meta: Meta, title: Title, elem: ElementRef,
    flagService: FlagService, blockChanHostSettingsService: BlockChanHostSettingsService, loadingCalculatorService: LoadingCalculatorService) {
    this.Dialog = dialog;
    this.IndImmChanPostManagerService = indImmChanPostManagerService;
    this.AddressManagerService = indImmChanAddressManagerService;
    this.Route = route;
    this.Router = router;
    this.ToastrService = toastrSrvice;
    this.Sanitizer = sanitizer;
    this.PostingEnabled = true;
    this.Config = config; 
    this.GlobalEventService = globalEventService;
    this.EthTipService = ethTipService;
    this.Meta = meta;
    this.Title = title;
    this.Elem = elem;
    this.FlagService = flagService;
    this.BlockChanHostSettingsService = blockChanHostSettingsService;
    this.LoadingCalculatorService = loadingCalculatorService;
    this.GlobalEventService.EnableModeration.subscribe(state => {
      this.refresh(false);
    });

    this.GlobalEventService.ShowImagesToggled.subscribe(state=>{
    
      const cu: ChunkingUtility = new ChunkingUtility();
      if(state) {
        this.showImagesFromToggle()
      } else {
        this.hideImagesFromToggle();
      }
    });

  }

  async reloadImages() {
    if(this.Config.ShowImages) {
      if(this.PostDecrypted || !this.thread.IndImmChanPostModelParent.Enc){
        if(!this.thread.IndImmChanPostModelParent.Base64Image) {
          this.thread.IndImmChanPostModelParent.ImageLoading = true;
          this.IndImmChanPostManagerService.ManualOverRideShowImageFromRefresh(this.thread.IndImmChanPostModelParent).then(result=>{          
            this.thread.IndImmChanPostModelParent = result;
            this.thread.IndImmChanPostModelParent.ImageLoading = false;
          });
        }
      }

      for (let i = 0; i < this.thread.IndImmChanPostModelChildren.length; i++) {
        if (this.thread.IndImmChanPostModelChildren[i].IPFSHash && this.thread.IndImmChanPostModelChildren[i].IPFSHash.length > 0
          && (this.PostDecrypted || !this.thread.IndImmChanPostModelParent.Enc)) {
            if(!this.thread.IndImmChanPostModelChildren[i].Base64Image) {
              this.thread.IndImmChanPostModelChildren[i].ImageLoading = true;
              this.IndImmChanPostManagerService.ManualOverRideShowImageFromRefresh(this.thread.IndImmChanPostModelChildren[i]).then(result=> {
              this.thread.IndImmChanPostModelChildren[i] = result;
              this.thread.IndImmChanPostModelChildren[i].ImageLoading = false;
            });
          }
        }
      }
    }
  }

  async showImagesFromToggle() {
    
    if(this.PostDecrypted || !this.thread.IndImmChanPostModelParent.Enc){
      this.IndImmChanPostManagerService.ManualOverRideShowImage(this.thread.IndImmChanPostModelParent).then(result=>{
        this.thread.IndImmChanPostModelParent = result;
      });
    }
    for (let i = 0; i < this.thread.IndImmChanPostModelChildren.length; i++) {
      if (this.thread.IndImmChanPostModelChildren[i].IPFSHash && this.thread.IndImmChanPostModelChildren[i].IPFSHash.length > 0
        && (this.PostDecrypted || !this.thread.IndImmChanPostModelParent.Enc)) {
        this.IndImmChanPostManagerService.ManualOverRideShowImage(this.thread.IndImmChanPostModelChildren[i]).then(result=> {
          this.thread.IndImmChanPostModelChildren[i] = result;
        });
      }
    }
  }

  async hideImagesFromToggle() {
    this.IndImmChanPostManagerService.ManualOverRideHideImages(this.thread.IndImmChanPostModelParent).then(result=>{
      this.thread.IndImmChanPostModelParent = result;
    });
      for (let i = 0; i < this.thread.IndImmChanPostModelChildren.length; i++) {
        if (this.thread.IndImmChanPostModelChildren[i].IPFSHash && this.thread.IndImmChanPostModelChildren[i].IPFSHash.length > 0) {
        this.IndImmChanPostManagerService.ManualOverRideHideImages(this.thread.IndImmChanPostModelChildren[i]).then(results => {
          this.thread.IndImmChanPostModelChildren[i] = results;
        });
      }
    }
  }

  async downloadWebm(post: IndImmChanPostModel){
    saveAs(post.Image, "download.webm");
    console.log('download');
  }
  public handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  async post() {
    if (this.postMessage.length > 1320) {
      this.ToastrService.error('Message must be less than 1320 characters.', 'Posting Error');
      return;
    }
    if (this.postMessage.length === 0) {
      this.ToastrService.error('Message is empty', 'Posting Error');
      return;
    }
    if (this.postTitle.length> 80) {
      this.ToastrService.error('Title must be less than 80 characters.', 'Posting Error');
      return;
    }
    if (this.fileToUpload) {
      if (this.fileToUpload.size > 4400000) {
        this.ToastrService.error('File must be below 4 Megs', 'Posting Error');
        return;
      }
      if (!(this.fileToUpload.type === 'image/jpeg' ||
        this.fileToUpload.type === 'image/gif' ||
        this.fileToUpload.type === 'video/webm' ||
        this.fileToUpload.type === 'image/png')) {
          this.ToastrService.error('File must be of type Jpeg, Gif, PNG or Webm', 'Posting Error');
          return;
      }
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
    }  else {
      this.IndImmChanPostManagerService.IndImmChanPostService.TripKey = '';
      this.IndImmChanPostManagerService.IndImmChanPostService.TripSecret = '';
      this.IndImmChanPostManagerService.IndImmChanPostService.TripValid = false;
    }
    
    if(!this.ShowTripEntry) {
      this.posterName = 'Anonymous';
    }

    this.Posting = true;
    try {
      this.blockPosting();
      const postResult = await this.IndImmChanPostManagerService.post(this.postTitle, this.postMessage, this.posterName, this.fileToUpload,
        this.postBoard, this.parentTx, this.EncryptedKey, this.EthTipAddress, useTrip, await this.FlagService.GetFlag());
      this.PostingError = false;

      var newPost = new IndImmChanPostModel();
      newPost.IPFSHash = postResult.IPFSHash;
      newPost.Title = this.postTitle;
      newPost.Msg = this.postMessage;
      newPost.MsgSafeHtml = this.postMessage;
      newPost.Name = this.posterName;
      newPost.Parent = this.parentTx;
      newPost.ETH = this.EthTipAddress;
      newPost.Timestamp = new Date();
      newPost.Tx = '';

      this.thread.IndImmChanPostModelChildren.push(newPost);


       this.refresh(true);
    } catch (error) {
      console.log(error);
      this.PostingError = true;
      this.PostingEnabled = true;
    }  
    this.Posting = false;
  }

  async refresh(silent: boolean) {

    if(!silent) {
      this.PostLoading = true;
    }
    while (!this.IndImmChanPostManagerService.IndImmChanPostService.rippleService.Connected) {
      await this.IndImmChanPostManagerService.IndImmChanPostService.chunkingUtility.sleep(1000);
    }
    await this.IndImmChanPostManagerService.IndImmChanPostService.chunkingUtility.sleep(100);

    window.scrollTo(0,document.body.scrollHeight);

    const threadResult = await this.IndImmChanPostManagerService.GetPostsForPostViewer(this.AddressManagerService.GetBoardAddress(this.postBoard), 
      this.parentTx);
    threadResult.Board = this.postBoard;
    threadResult.Prep(this.BlockChanHostSettingsService.BaseUrl);
    this.thread = threadResult;
    this.PostLoading = false;

    if (this.PostDecrypted) {
      this.decrypt(); 
    }
    try {
          localStorage.setItem('thread-' + this.thread.IndImmChanPostModelParent.Tx, JSON.stringify(this.thread));
    } catch (error) {
      console.log('Storage out of space more than likely, work around coming');
    }
    this.loadCatalogAsync();
  }

  async ToggleFullSizeFile(post: IndImmChanPostModel) {
    post.ShowFullSizeFile = !post.ShowFullSizeFile;
  }

  async loadCatalogAsync() {
    const boardCatalog = await this.IndImmChanPostManagerService.GetPostsForCatalog(this.AddressManagerService.GetBoardAddress(this.postBoard));
    boardCatalog.sort(this.threadCompare)
    try {
      localStorage.setItem(this.postBoard, JSON.stringify(boardCatalog));
    } catch (error) {
      console.log('Storage out of space more than likely, work around coming');
    }
  }

  threadCompare( a: IndImmChanThread, b:IndImmChanThread ) {
    if ( a.LastCommentTime < b.LastCommentTime ){
      return 1;
    }
    if ( a.LastCommentTime > b.LastCommentTime ){
      return -1;
    }
    return 0;
  }

  ngOnInit() {


    const board = this.Route.snapshot.params['board'];
    const id = this.Route.snapshot.params['id'];

  
    console.log('board: ' + board);
    this.postBoard=board;
    if (board === 'pol') {
      this.postBoardName = 'Politically Incorrect';
    } else if (board === 'biz') {
      this.postBoardName = 'Business';
    } else if (board === 'b') {
      this.postBoardName = 'Random';
    } else if (board === 'm') {
      this.postBoardName = 'Meta';
    } else if (board === 'a') {
      this.postBoardName = 'Anime';
    } else if (board === 'k') {
      this.postBoardName = 'Weapons';
    } else if (board === 'g') {
      this.postBoardName = 'Technology';
    }else if (board === 'lit') {
      this.postBoardName = 'Literature';
    }  else if (board === 'con') {
      this.postBoardName = 'Conspiracy';
    } else if (board === 'v') {
      this.postBoardName = 'Video Games';
    } else if (board === 'mis') {
      this.postBoardName = 'Mission Planning';
    } else if (board === 'int') {
      this.postBoardName = 'International';
    }
    
    this.HeaderImage = 'assets/images/headers/' + this.postBoard + '-1.jpg';

    this.parentTx=id;

    const threadString = localStorage.getItem('thread-' + id);
    if(threadString) {
      const cu: ChunkingUtility = new ChunkingUtility();

      const threadBare: IndImmChanThread = JSON.parse(threadString);
      const children: IndImmChanPostModel[] = [];

      const parent: IndImmChanPostModel = cu.HydratePostModel(threadBare.IndImmChanPostModelParent);
      let imageCounter = 1;
      for (let i = 0; i < threadBare.IndImmChanPostModelChildren.length; i++) {
        children.push(cu.HydratePostModel(threadBare.IndImmChanPostModelChildren[i]));
        if (threadBare.IndImmChanPostModelChildren[i].HasImage){
          imageCounter++;
        }
      }

      const thread: IndImmChanThread = new IndImmChanThread();
      thread.IndImmChanPostModelParent = parent;
      thread.IndImmChanPostModelChildren = children;
      thread.TotalReplies = children.length;
      thread.ImageReplies = imageCounter;
      this.thread = thread;
      this.Title.setTitle('BlockChan - /' + this.postBoard + '/ - ' + this.thread.IndImmChanPostModelParent.Title);




      this.reloadImages();
      // this.refresh(true);
    }
    else {
      this.refresh(false);
    }
    /*
    this.removeTagIfExists('twitter:card');
    this.removeTagIfExists('twitter:site');
    this.removeTagIfExists('twitter:creator');
    this.removeTagIfExists('twitter:title');
    this.removeTagIfExists('twitter:description');
    this.removeTagIfExists('twitter:image');

    this.Meta.addTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.Meta.addTag({ name: 'twitter:site', content: '@ind_imm' });
    this.Meta.addTag({ name: 'twitter:creator', content: '@ind_imm' });
    this.Meta.addTag({ name: 'twitter:title', content: encodeURIComponent(this.thread.IndImmChanPostModelParent.Title) });
    this.Meta.addTag({ name: 'twitter:description', content: encodeURIComponent(this.thread.IndImmChanPostModelParent.Msg
      .substring(0, Math.min(this.thread.IndImmChanPostModelParent.Msg.length, 70)).trim())});
    this.Meta.addTag({ name: 'twitter:image', content: 'https://ipfs.io/ipfs/' + this.thread.IndImmChanPostModelParent.IPFSHash });
      */
  }

  removeTagIfExists(tag) {
    const tagToRemove = this.Meta.getTag('name=\'' + tag + '\'');
    if(tagToRemove) {
     this.Meta.removeTagElement(tagToRemove);
    }
  }

  async ManualOverRideShowImage(post: IndImmChanPostModel) {
    post.ShowFullSizeFile = false;
    post.ImageLoading = true;
    await this.IndImmChanPostManagerService.ManualOverRideShowImage(post);
  }

  quoteMessage(tx) {
    this.postMessage = '>>' + tx + '\n' + this.postMessage;
    this.ShowPostingForm = true;
    window.scrollTo(0,0);

  }
  OpenCatalog() {
    this.Router.navigate(['/catalog/' + this.postBoard]);
  }
}
