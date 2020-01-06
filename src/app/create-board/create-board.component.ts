import { Component, OnInit } from '@angular/core';
import { CreateBoard } from '../create-board';
import { IndImmChanPostService } from '../ind-imm-chan-post.service';
import { IfStmt } from '@angular/compiler';
import { CreateBoardService } from '../create-board.service';

@Component({
  selector: 'app-create-board',
  templateUrl: './create-board.component.html',
  styleUrls: ['./create-board.component.scss']
})
export class CreateBoardComponent implements OnInit {
  IndImmChanPostService: IndImmChanPostService;
  CreateBoardService: CreateBoardService

  boardName = '';
  boardAddress = '';
  boardDescription = '';
  boardXRPAddress = '';
  boardXRPSecret = '';
  boardsModXRPAddress = '';
  boardsModXRPSecret = '';

  createdBoardSuccess = false;

  createBoardError = false;
  createBoardErrorMessage = '';

  processingBoardCreation = false;

  constructor(postService: IndImmChanPostService, createBoardService: CreateBoardService) { 
    this.IndImmChanPostService = postService;
    this.CreateBoardService = createBoardService;
  }

  ngOnInit() {
  }

  async CreateBoard() {
    this.processingBoardCreation = true;

    const createBoardRequest = new CreateBoard();
    createBoardRequest.BoardAddress = this.boardAddress;
    createBoardRequest.BoardDescription = this.boardDescription;
    createBoardRequest.BoardName = this.boardName;
    createBoardRequest.BoardXRPAddress = this.boardXRPAddress;
    createBoardRequest.BoardsModXRPAddress = this.boardsModXRPAddress;

    const creatorValid = await this.IndImmChanPostService.rippleService.IsSenderSecretValid(this.boardXRPAddress, this.boardXRPSecret);
    
    let modValid = true;
    
    if (this.boardsModXRPAddress.length > 0) {
      modValid = await this.IndImmChanPostService.rippleService.IsSenderSecretValid(this.boardsModXRPAddress, this.boardsModXRPSecret);
    }

    if(this.boardName.length == 0) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board Name cannot be empty';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardDescription.length == 0) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board description cannot be empty';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardAddress.length == 0) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board address cannot be empty';
      this.processingBoardCreation = false;
      return;
    }


    if(this.boardName.length > 20) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board Name cannot be greater than 20 characters';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardDescription.length > 80) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board description cannot be greater than 80 characters';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardAddress.length > 5) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board address cannot be greater than 5 characters';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardXRPAddress.length == 0) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board XRP address cannot be empty';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardXRPSecret.length == 0) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Board XRP Secret cannot be empty';
      this.processingBoardCreation = false;
      return;
    }

    if(!creatorValid) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Invald Address/Secret for board creation address';
      this.processingBoardCreation = false;
      return;
    }

    if(!modValid) {
      this.createBoardError = true;
      this.createBoardErrorMessage = 'Invald Address/Secret for moderation address';
      this.processingBoardCreation = false;
      return;
    }

    if(this.boardsModXRPAddress === this.boardXRPAddress){
      this.createBoardError = true;
      this.createBoardErrorMessage = "Board XRP address must be different than mod address";
      this.processingBoardCreation = false;
      return;
    }

    const validationResult = await this.CreateBoardService.PreValidateBoardCreation(createBoardRequest);

    if (!validationResult.Success) {
      this.createdBoardSuccess = false;
      this.createBoardError = true;
      this.createBoardErrorMessage = validationResult.ErrorMessage;
    } else {
      var resultTx = await this.IndImmChanPostService.createBoard(createBoardRequest, this.boardXRPAddress, this.boardXRPSecret);
    
      if(resultTx.length > 0 ){
        this.createdBoardSuccess = true;
        this.createBoardError = false;
      } else {
        this.createBoardError = true;
        this.createBoardErrorMessage = 'Error creating board';
        this.createdBoardSuccess = false;
      } 
    }

    

    this.processingBoardCreation = false;

  }
}
