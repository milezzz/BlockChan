import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-board',
  templateUrl: './create-board.component.html',
  styleUrls: ['./create-board.component.scss']
})
export class CreateBoardComponent implements OnInit {
  boardName = '';
  boardAddress = '';
  boardDescription = '';
  boardXRPAddress = '';
  boardXRPSecret = '';
  boardsModXRPAddress = '';
  boardsModXRPSecret = '';
  constructor() { }

  ngOnInit() {
  }

}
