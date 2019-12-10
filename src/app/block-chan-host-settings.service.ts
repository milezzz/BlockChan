import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BlockChanHostSettingsService {

  public IsHostedOnGithub = false;
  public GitHubRepo = ''; //only populate if hosting site on gh-pages

  //public TwitterLink = 'https://twitter.com/ind_imm';
  public TwitterLink = 'https://twitter.com/blockchan_ca';

  // public KeyBaseLink = '';
  public KeyBaseLink = 'https://keybase.io/blockchan';
  public BaseUrl = 'https://blockchan.ca'

  public MainHeader = 'BlockChan Canada';
  public Footer = '';

  public HomeLink = '';
  public BoardsLink = '';
  public AboutLink = '';

  constructor() {
    if (this.IsHostedOnGithub) {
      this.HomeLink = '';
      this.BoardsLink = 'boards';
      this.AboutLink =  'about';
    } else {
      this.HomeLink = '/';
      this.BoardsLink = '/boards';
      this.AboutLink = '/about';
    }
  }
}
