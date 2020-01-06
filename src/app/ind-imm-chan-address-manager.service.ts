import { Injectable } from '@angular/core';
import { IndImmConfigService } from './ind-imm-config.service';
import { ChunkingUtility } from './chunking-utility';

@Injectable({
  providedIn: 'root'
})
export class IndImmChanAddressManagerService {
  IndImmConfigService: IndImmConfigService;
  ChunkingUtility: ChunkingUtility;

  public pins() {
    return 'g4hi343f94ff:5g;::6i';
  }

  public ForceProd() {
    this.IndImmConfigService.IsDev = false;
  }
  public pina() {
    return '<5ii7:f538e73:h89hf<i645e863e;35d:6<5i::3hh<e:7iifed77775ie;f:h4'
  }
  public GetParentPostMemoType() {
    return '706172656e74';
  }

  public GetChildPostMemoType() {
    return '6368696c64';
  }

  public GetWarningsAddress() {
    if(!this.IndImmConfigService.IsDev) {
      return 'rHJKTrXF8mux8TgfThVD7GqPE9nyYJM8w2';
    }
    else {
      return 'r3wfVpF2XU2CcceTkiFTh4SDfavv6MuSsV';
    }
  }

  public GetBoardCreationAddress() {
    return 'rBEydHVNZDgjhS8zNAqa5MxHeXwS7ev8dU';
  }

  public GetBoardAddress(board: string) {
    if (board==='pol'){
      if(!this.IndImmConfigService.IsDev) {
        return 'r9PbUujoWyb9HJE6gi2kWNYfimBYW1LLiZ';
      } else {
        return 'r3wfVpF2XU2CcceTkiFTh4SDfavv6MuSsV';
      }    
    } else if (board==='biz'){
      if(!this.IndImmConfigService.IsDev) {
        return 'r3bDnS7t3aJKJiSj3CFnWGTG4Q8yioZybd';
      } else {
        return 'rw4RGGNK8VYy2NwUyBzrHEy91SiFTGaQyF';
      }    
    } else if (board==='b'){
      if(!this.IndImmConfigService.IsDev) {
        return 'rsJUkJNQnc2rQpF8aYKLyiApip9vctWDdk';
      } else {
        return 'rfsBWpRjwHucY8j6r1AtoqbvogNXcThNbQ';
      }    
    } else if (board==='g'){
      if(!this.IndImmConfigService.IsDev) {
        return 'rhH1W3YgBvVBzKJArdioCjV2TXhuHsrKBL';
      } else {
        return '';
      }    
    } else if (board==='m'){
      if(!this.IndImmConfigService.IsDev) {
        return 'rKCVDtR2uAqDNxz7wcoZF4GzUReR7g7amB';
      } else {
        return '';
      }    
    } else if (board==='k'){
      if(!this.IndImmConfigService.IsDev) {
        return 'rMmoXvAohZPjeeDRW5999FCNgcFGuNTPWP';
      } else {
        return '';
      }    
    } else if (board==='a'){
      if(!this.IndImmConfigService.IsDev) {
        return 'rBTjhx2niB8q3G8HRDb9NWU3RfGdrAMWRH';
      } else {
        return '';
      }    
    } else if (board==='lit') {
      if(!this.IndImmConfigService.IsDev) {
        return 'rnTJ8Fb9UmGnsHKh4b6D27Z52xXtvtHQwt';
      } else {
        return '';
      }    
    } else if (board==='con') {
      if(!this.IndImmConfigService.IsDev) {
        return 'rpgZz8kE6WRtoPWvJ5McCoWfFHfr65kS22';
      } else {
        return '';
      }    
    } else if (board==='v') {
      if(!this.IndImmConfigService.IsDev) {
        return 'r4Z1NQDypWLD9BBpMDPNdsj8mEj2zsrzLZ';
      } else {
        return '';
      }    
    } else if (board==='mis') {
      if(!this.IndImmConfigService.IsDev) {
        return 'rfJmo6zGkumYMukxdNv5sKZ8r7K65EnJDF';
      } else {
        return '';
      }    
    } else if (board==='int') {
      if(!this.IndImmConfigService.IsDev) {
        return 'rQG4eZM8XqNMA8NrPkNi3TzNZAEdx1fWuz';
      } else {
        return '';
      }    
    }
  }

  public wa() {
    if(!this.IndImmConfigService.IsDev) {
      return 'r3VKdSsHd3koFNpszpmbtUMvUJwnEcXYXu';
    } else {
      return 'uqnz\\GHXOtDQ5WwUuK\\9Wr<;KH4vwM88wr';
    }
  }

  public ra() {
    if(!this.IndImmConfigService.IsDev) {
      return 'u<WsZzqpTEuUq<ypSmqDOV8YOsNdrNY5EU';
    } else {
      return 'uqnz\\GHXOtDQ5WwUuK\\9Wr<;KH4vwM88wr';
    }
  }

  public ran() {
    if(!this.IndImmConfigService.IsDev) {
      const arr: string[] = [];
      arr.push('uKsMO9x<uIr;sDf6Kd4ujXViPek:K9Kh{H');
      arr.push('u6O<NVl6;[5gGrlrW]nqpPVzKGtK|jXh|e');
      arr.push('u<WsZzqpTEuUq<ypSmqDOV8YOsNdrNY5EU');

      var item = arr[Math.floor(Math.random()*arr.length)];
      return item;
    } else {
      return 'uvFK8DVj|N]fvQ5[pQEHgsNEMlOslYIHNF';
    }
  }
  
    
  public rsn(k) {
    if(!this.IndImmConfigService.IsDev) {
      if (k ==='uKsMO9x<uIr;sDf6Kd4ujXViPek:K9Kh{H') {
        return 'vvWjwwh{nt5KkV:Gg[mJjv5Tk6}nM';
      } else if (k ==='u6O<NVl6;[5gGrlrW]nqpPVzKGtK|jXh|e') {
        return 'vkq|8JX\\slMTODsTdE{Zv7\\pnq6;{';
      } else if (k ==='u<WsZzqpTEuUq<ypSmqDOV8YOsNdrNY5EU') {
        return 'vqU6s4p}fU|X][kFH7VwOnqNrvidW';
      } 
    } else {
      return 'vvXY\\MiSSmO5q8Q]uMGH4vsJdTsGV';
    }
  }

  public rs() {
    if(!this.IndImmConfigService.IsDev) {
      return 'vqU6s4p}fU|X][kFH7VwOnqNrvidW';
    } else {
      return 'vs;9fOz6:rmvFzGwF<zw:5wnIzKrN';
    }
  }
  constructor(indImmConfigSer: IndImmConfigService) { 
    this.ChunkingUtility = new ChunkingUtility();
    this.IndImmConfigService = indImmConfigSer;
  }
}
