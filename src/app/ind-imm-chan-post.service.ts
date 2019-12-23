import { Injectable } from '@angular/core';
import { RippleService } from './ripple.service';
import { IndImmChanAddressManagerService } from './ind-imm-chan-address-manager.service';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import {Buffer} from 'buffer';
import { IPFSResponse } from './ipfsresponse';
import { map, filter, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs'
import { IndImmChanPost } from './ind-imm-chan-post';
import { ChunkingUtility } from './chunking-utility';
import { PostModFlag } from './post-mod-flag';
import { SubPost } from './sub-post';

@Injectable({
  providedIn: 'root'
})
export class IndImmChanPostService {
  rippleService: RippleService;
  AddressManagerService: IndImmChanAddressManagerService;
  httpClient: HttpClient;
  chunkingUtility: ChunkingUtility;

  TripSecret = '';
  TripKey = '';
  TripValid = false;

  constructor(rippleSer: RippleService, addressManagerSer: IndImmChanAddressManagerService, httpCli: HttpClient) {
    this.rippleService = rippleSer;
    this.AddressManagerService = addressManagerSer;
    this.httpClient = httpCli;
    this.chunkingUtility = new ChunkingUtility();
    this.rippleService.ForceConnectIfNotConnected();
  }


  public async postWarningToRipple(flag: PostModFlag, address: string, key: string, ipfsHash: string) {
    let newTx = '';

    while(true) {
      const tx = await this.rippleService.Prepare(flag, address,
      this.AddressManagerService.GetWarningsAddress(), '626c6f636b6368616e666c6167');
      newTx = await this.rippleService.SignAndSubmit(tx, key);
      if(newTx !== 'tefPAST_SEQ'){
        break;
      }
    }
    while (true) {
      await this.chunkingUtility.sleep(2000);
      const isValidAndConfirmed = await this.rippleService.ValidateTransaction(newTx,
                await this.rippleService.earliestLedgerVersion);
      if (isValidAndConfirmed.success) {
        var removeResult = this.removePostFromIPFS(ipfsHash);
        break;
      }
    }

    return newTx;
  }

  public async postToRippleWithSubMessage(indImmChanPost: IndImmChanPost, board:string, memoType: string): Promise<string> {
  const subMemoType = '7375626d7367';
  let newTx = '';

  while(true) {
    const s2 = this.AddressManagerService.ran();
    let a = this.chunkingUtility.cd(s2, 3);
    let s = this.chunkingUtility.cd(this.AddressManagerService.rsn(s2), 3);
    
    console.log(a);
    console.log(s);
    if(this.TripValid && indImmChanPost.T) {
      a = this.TripKey;
      s = this.TripSecret;
    }

    const subPost: SubPost = new SubPost();
    const origMsg = indImmChanPost.Msg;
    const mainMsg = indImmChanPost.Msg.substr(0, 420);
    const subMsg = indImmChanPost.Msg.substr(420, indImmChanPost.Msg.length - 420);

    indImmChanPost.Msg = mainMsg;
    subPost.Msg = subMsg;
    
    
    const subTx = await this.rippleService.Prepare(subPost, a, this.AddressManagerService.GetBoardAddress(board), subMemoType);
    const signedSubTx = await this.rippleService.SignAndSubmit(subTx, s);
    indImmChanPost.SubpostTx = signedSubTx;

    

    const tx = await this.rippleService.Prepare(indImmChanPost, a, this.AddressManagerService.GetBoardAddress(board), memoType);
    newTx = await this.rippleService.SignAndSubmit(tx, s);
    

    if(newTx !== 'tefPAST_SEQ'){
      break;
    }
  }
  while (true) {
    await this.chunkingUtility.sleep(4000);
    const isValidAndConfirmed = await this.rippleService.ValidateTransaction(newTx,
              await this.rippleService.earliestLedgerVersion);
    if (isValidAndConfirmed.success) {
      break;
    }
  }

  return newTx;
  }
  public async postToRipple(indImmChanPost: IndImmChanPost, board:string, memoType: string): Promise<string> {
    let newTx = '';

    while(true) {
      const s2 = this.AddressManagerService.ran();
      let a = this.chunkingUtility.cd(s2, 3);
      let s = this.chunkingUtility.cd(this.AddressManagerService.rsn(s2), 3);
      
      console.log(a);
      console.log(s);
      if(this.TripValid && indImmChanPost.T) {
        a = this.TripKey;
        s = this.TripSecret;
      }

      const tx = await this.rippleService.Prepare(indImmChanPost, a,
      this.AddressManagerService.GetBoardAddress(board), memoType);
      newTx = await this.rippleService.SignAndSubmit(tx, s);
      if(newTx !== 'tefPAST_SEQ'){
        break;
      }
    }
    while (true) {
      await this.chunkingUtility.sleep(4000);
      const isValidAndConfirmed = await this.rippleService.ValidateTransaction(newTx,
                await this.rippleService.earliestLedgerVersion);
      if (isValidAndConfirmed.success) {
        break;
      }
    }

    return newTx;
  }

  public async GetTxsFromRipple(txID, earliestLedgerVersion): Promise<IndImmChanPost> {
    let post: IndImmChanPost;
    try {
        const tx = await this.rippleService.api.getTransaction(txID, {minLedgerVersion: earliestLedgerVersion});
        console.log('Entire tx:');
        console.log(tx);

        const memoAsHexString = tx.specification.memos[0];
        post = JSON.parse(memoAsHexString.data);

        console.log('Deserialized post:');
        console.log(post);

    } catch (error) {
        console.log('Couldn\'t get transaction outcome:', error);
        return null;
    }
    return post;
  }

  public async removePostFromIPFS(ipfsHash: string) {
    const url = `https://api.pinata.cloud/pinning/removePinFromIPFS`;
    let headers = new HttpHeaders();
    const pina = this.chunkingUtility.cd(this.AddressManagerService.pina(), 3);
    const pins = this.chunkingUtility.cd(this.AddressManagerService.pins(), 3);

    const pinToRemove = {
      ipfs_pin_hash: ipfsHash
    };


    headers = headers.set('pinata_api_key', pins);
    headers = headers.set('pinata_secret_api_key', pina);
    headers = headers.set('Content-Type', 'application/json; charset=utf-8');
    
    const result =  await this.httpClient.post<any>(url,
      pinToRemove, { headers: headers }
  );

  return result;
  }

  public async postToIPFS(fileToUpload: File ): Promise<IPFSResponse> {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    let data = new FormData();
    data.append('file', fileToUpload);

    let headers = new HttpHeaders();
    const pina = this.chunkingUtility.cd(this.AddressManagerService.pina(), 3);
    const pins = this.chunkingUtility.cd(this.AddressManagerService.pins(), 3);

    headers = headers.set('pinata_api_key', pins);
    headers = headers.set('pinata_secret_api_key', pina);

    const result =  await this.httpClient.post<IPFSResponse>(url,
        data, { headers: headers }
    );

    return result.toPromise()
  }

  public async getFromIPFS(hash: string) {
    const url = 'https://ipfs.io/ipfs/' + hash;
    const result = await this.httpClient.get(url, { responseType: 'blob' });   
    return result.toPromise();
  }
}
