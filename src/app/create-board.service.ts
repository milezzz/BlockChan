import { Injectable } from '@angular/core';
import { IndImmChanPostManagerService } from './ind-imm-chan-post-manager.service';
import { CreateBoard } from './create-board';
import { CreateBoardValidationResult } from './create-board-validation-result';

@Injectable({
  providedIn: 'root'
})
export class CreateBoardService {
  IndImmChanPostManagerService: IndImmChanPostManagerService;

  constructor(indImmChanPostManagerService: IndImmChanPostManagerService) { 
    this.IndImmChanPostManagerService = indImmChanPostManagerService;
  }

  public async PreValidateBoardCreation(boardToCheck: CreateBoard): Promise<CreateBoardValidationResult> {
    let retVal = new CreateBoardValidationResult();
    retVal.Success = true;
    const existingBoards = await this.IndImmChanPostManagerService.GetUserCreatedBoardList();


    let boardCheck = await this.checkIfBoardAddressHasEverBeenUsed(boardToCheck, existingBoards);
    if (!boardCheck.Success) {
      return boardCheck;
    }

    let titleCheck = await this.checkIfTitleHasEverBeenUsed(boardToCheck, existingBoards);
    if (!titleCheck.Success) {
      return titleCheck;
    }
    
    
    let addressCheck = await this.checkIfXRPAddressHasPreviouslyCreatedBoard(boardToCheck, existingBoards);
    if (!addressCheck.Success) {
      return addressCheck;
    } 
    return retVal;
  }

  private checkIfXRPAddressHasPreviouslyCreatedBoard(boardToCheck: CreateBoard, existingBoards: CreateBoard[]): CreateBoardValidationResult {
    let retVal = new CreateBoardValidationResult();
    retVal.Success = true;
    
    for (var i = 0; i < existingBoards.length; i++) {
      const b = existingBoards[i];
      if (b.BoardXRPAddress == boardToCheck.BoardXRPAddress) {
        retVal.Success = false;
        retVal.ErrorMessage = 'XRP Address has already created a board';
        break;
      }
    }  
    return retVal;
  }

  private checkIfBoardAddressHasEverBeenUsed(boardToCheck: CreateBoard, existingBoards: CreateBoard[]): CreateBoardValidationResult {
    let retVal = new CreateBoardValidationResult();
    retVal.Success = true;

    for (var i = 0; i < existingBoards.length; i++) {
      const b = existingBoards[i];
      if (b.BoardAddress == boardToCheck.BoardAddress) {
        retVal.Success = false;
        retVal.ErrorMessage = 'Board Address Already Exists';
        break;
      }
    }  

    if (boardToCheck.BoardAddress === 'pol') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'biz') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'b') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'm') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'a') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'k') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'g') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'lit') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    }  else if (boardToCheck.BoardAddress === 'con') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'v') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'mis') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    } else if (boardToCheck.BoardAddress === 'int') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Address Already Exists';
    }

    return retVal;
  }

  private checkIfTitleHasEverBeenUsed(boardToCheck: CreateBoard, existingBoards: CreateBoard[]): CreateBoardValidationResult {
    let retVal = new CreateBoardValidationResult();
    retVal.Success = true;

    for (var i = 0; i < existingBoards.length; i++) {
      const b = existingBoards[i];
      if (b.BoardName == boardToCheck.BoardName) {
        retVal.Success = false;
        retVal.ErrorMessage = 'Board Name Already Exists';
        break;
      }
    }  

    if (boardToCheck.BoardAddress === 'Politically Incorrect') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Business') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Random') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Meta') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Anime') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Weapons') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Technology') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Literature') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    }  else if (boardToCheck.BoardName === 'Conspiracy') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Video Games') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'Mission Planning') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    } else if (boardToCheck.BoardName === 'International') {
      retVal.Success = false;
      retVal.ErrorMessage = 'Board Name Already Exists';
    }

    return retVal;
  }
}
