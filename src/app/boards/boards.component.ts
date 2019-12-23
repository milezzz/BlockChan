import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Meta } from '@angular/platform-browser';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss']
})
export class BoardsComponent implements OnInit {
  Router: Router;
  Meta: Meta;
  Title: Title;

  constructor(router:Router, meta: Meta, title: Title) {
    this.Router = router;
    this.Meta = meta;
    this.Title = title;
    this.Title.setTitle("BlockChan Boards");
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
    this.Meta.addTag({ name: 'twitter:title', content: 'BlockChan Boards'});
    this.Meta.addTag({ name: 'twitter:description', content: 'Boards available on BlockChan'});
    this.Meta.addTag({ name: 'twitter:image', content: 'assets/images/biglogo.png' });
    */
  }

  removeTagIfExists(tag) {
    const tagToRemove = this.Meta.getTag('name=\'' + tag + '\'');
    if(tagToRemove) {
     this.Meta.removeTagElement(tagToRemove);
    }
  }

  ngOnInit() {


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

}
