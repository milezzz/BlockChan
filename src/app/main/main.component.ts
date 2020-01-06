import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { IndImmConfigService } from '../ind-imm-config.service';
import {MatSlideToggle} from '@angular/material';
import { Meta } from '@angular/platform-browser';
import {Title} from '@angular/platform-browser';
import { BlockChanHostSettingsService } from '../block-chan-host-settings.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})

export class MainComponent implements OnInit {
  router: Router;
  Config: IndImmConfigService
  Meta: Meta;
  Title: Title;
  BlockChanHostingService: BlockChanHostSettingsService;

  constructor(rtr: Router, config: IndImmConfigService, meta: Meta, title: Title, blockChanHostingService: BlockChanHostSettingsService) {
    this.router = rtr;
    this.Config = config;
    this.Meta = meta;
    this.Title = title;
    this.BlockChanHostingService = blockChanHostingService;
  }

  public viewUpload() {
    this.router.navigate(['/upload']);
  }

  public viewViewPortal() {
    this.router.navigate(['/viewPortal']);
  }

  public viewBoards() {
    this.router.navigate(['/boards']);
  }
  ngOnInit() {
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
    this.Meta.addTag({ name: 'twitter:title', content: 'BlockChan'});
    this.Meta.addTag({ name: 'twitter:description', content: 'Infinite. Immutable. Indestructible Discussions.'});
    this.Meta.addTag({ name: 'twitter:image', content: 'assets/images/biglogo.png' });
    */
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

  removeTagIfExists(tag) {
    const tagToRemove = this.Meta.getTag('name=\'' + tag + '\'');
    if(tagToRemove) {
     this.Meta.removeTagElement(tagToRemove);
    }
  }
}
