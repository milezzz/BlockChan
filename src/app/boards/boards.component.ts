import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Meta } from '@angular/platform-browser';
import {Title} from '@angular/platform-browser';
import { IndImmChanPostManagerService } from '../ind-imm-chan-post-manager.service';
import { CreateBoard } from '../create-board';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss']
})

export class BoardsComponent implements OnInit {
  Router: Router;
  Meta: Meta;
  Title: Title;
  IndImmChanPostManagerService: IndImmChanPostManagerService;
  UserCreatedBoareds: CreateBoard[];
  UserBoardsLoading = false;

  constructor(router:Router, meta: Meta, title: Title, postManagerService: IndImmChanPostManagerService) {
    this.IndImmChanPostManagerService = postManagerService;
    this.Router = router;
    this.Meta = meta;
    this.Title = title;
    this.Title.setTitle("BlockChan Boards");
    this.loadUserBoards();
  }

  async loadUserBoards() {
    this.UserBoardsLoading = true;
    const userCreatedBoards = await this.IndImmChanPostManagerService.GetUserCreatedBoardList();
    this.UserCreatedBoareds = userCreatedBoards;
    this.UserBoardsLoading = false;
  }

  removeTagIfExists(tag) {
    const tagToRemove = this.Meta.getTag('name=\'' + tag + '\'');
    if(tagToRemove) {
     this.Meta.removeTagElement(tagToRemove);
    }
  }

  ngOnInit() {


  }

  OpenUserCreatedBoard(board: CreateBoard) {
    this.Router.navigate(['/catalog/' + board.BoardAddress]);
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
