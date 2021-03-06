import { Injectable } from '@angular/core';
import { ChunkingUtility } from './chunking-utility';
import { GeneralResult } from './general-result';
import { IndImmConfigService } from './ind-imm-config.service';
import {ToastrService} from 'ngx-toastr';
import {FileProgressService} from './file-progress.service';
import { LoadingCalculatorService } from './loading-calculator.service';

declare var ripple: any;

@Injectable({
  providedIn: 'root'
})
export class RippleService  {
  api: any = null;

  secondaryApi: any = null;
  secondaryApiAvailable = false;

  thirdApi: any = null;
  thirdApiAvailable = false;

  fourthApi: any = null;
  fourthApiAvailable = false;

  fifthApi: any = null;
  fifthApiAvailable = false;

  public maxLedgerVersion: number;
  public earliestLedgerVersion: number;
  public Config: IndImmConfigService;
  toaster: ToastrService;
  public Connected = false;
  sequenceNumber = 0;
  public AccountForSequence = '';
  FileProgressService: FileProgressService;
  LoadingCalculatorService: LoadingCalculatorService;
  
  public AllConnected(): boolean {
    if(this.Connected && this.secondaryApiAvailable && this.thirdApiAvailable) {
      return true;
    } else {
      return false;
    }
  }

  constructor(cfg: IndImmConfigService, tstr: ToastrService, filePrgSvc: FileProgressService, loadingCalculatorService: LoadingCalculatorService) {
    this.toaster = tstr;
    this.Config = cfg;
    this.FileProgressService = filePrgSvc;
    this.LoadingCalculatorService = loadingCalculatorService
    // this.ConnectAPI();
   }

   public async GetApiInstance(instance: number): Promise<any> {
    console.log('Using Instance: ' + instance); 
    let cu: ChunkingUtility = new ChunkingUtility();

    if (instance == 1) {
      console.log('returning API 1 with state: ' + this.Connected);
      while(!this.Connected){
        await cu.sleep(2000);
        console.log('stuck in api instance number: ' +  instance);
      }
      return await this.api;
     } else if (instance == 2) {
      console.log('returning API 2 with state: ' + this.secondaryApiAvailable);
      while(!this.secondaryApiAvailable){
        await cu.sleep(2000);
        console.log('stuck in api instance number: ' +  instance);
      }
      return await this.secondaryApi;
     } else if (instance == 3) {
      console.log('returning API 3 with state: ' + this.thirdApiAvailable);
      while(!this.thirdApiAvailable){
        await cu.sleep(2000);
        console.log('stuck in api instance number: ' +  instance);
      }
      return await this.thirdApi;
     } else if (instance == 4) {
      console.log('returning API 4 with state: ' + this.fourthApiAvailable);
      while(!this.fifthApiAvailable){
        await cu.sleep(2000);
        console.log('stuck in api instance number: ' +  instance);
      }
      return await this.fourthApi;
     } else if (instance == 5) {
      console.log('returning API 5 with state: ' + this.fifthApiAvailable);
      while(!this.fifthApiAvailable){
        await cu.sleep(2000);
        console.log('stuck in api instance number: ' +  instance);
      }
      return await this.fifthApi;
     }
   }

   public async ForceConnectIfNotConnected() {
     if (!this.Connected || !this.secondaryApiAvailable || !this.thirdApiAvailable) {
       await this.ConnectAPI();
     }
   }

   public async CheckSequence() {
      if (this.AccountForSequence.length > 0) {
        /*  this.api.getAccountInfo(this.AccountForSequence).then(info =>  {
            this.sequenceNumber = info.sequence + 1;
        }); */
        const info = await this.api.getAccountInfo(this.AccountForSequence);
        this.sequenceNumber = info.sequence;
      }
   }

   public IncrementSequence() {
      this.sequenceNumber++;
   }

   public async ConnectAPIInstance(instance: any, instnaceNumber: number){
    instance.connect()
    .then(() => {
        return instance.getServerInfo();
      }).then((server_info) => {

        console.log('Ledger range: ' + server_info.completeLedgers);
        const ledgers = server_info.completeLedgers.split('-');
        this.earliestLedgerVersion = Number(ledgers[0]);
        this.maxLedgerVersion = Number(ledgers[1]);
        
        
          instance.on('ledger', ledger => {
            this.maxLedgerVersion = Number(ledger.ledgerVersion);
            // this.CheckSequence();
          });
        
          this.LoadingCalculatorService.IncrementNumberOfClientsConnected();

        this.toaster.toasts.forEach(t=>{
          this.toaster.remove(t.toastId);
        });
        console.log('Most recent hash: ' + server_info.validatedLedger.hash);
         /* this.toaster.show('Connected to Ripple [Instance: ' + instnaceNumber +  ' ] (' + this.Config.GetEnvironmentName() + '): '
          + this.Config.GetRippleServer(),
          'SUCCESS', {
          closeButton: true,
          disableTimeOut: true,
          toastClass: 'ngx-toastr tstr-success'
          }); */

          if (instnaceNumber == 1) {
            this.Connected = true;
          }
          else if (instnaceNumber == 2) {
            this.secondaryApiAvailable=true;
          } else if (instnaceNumber == 3) {
            this.thirdApiAvailable=true;
          }
          else if (instnaceNumber == 4) {
            this.fourthApiAvailable=true;
          }
          else if (instnaceNumber == 5) {
            this.fifthApiAvailable=true;
          }
          return;
      }).catch((error) => {
        this.toaster.error('Error Connecting to Ripple (' + this.Config.GetEnvironmentName() + '): '
        + this.Config.GetRippleServer(),
        'ERROR', {
          closeButton: true,
          disableTimeOut: true
        });
        if (instnaceNumber == 1) {
          this.Connected = false;
        }
        else if (instnaceNumber == 2) {
          this.secondaryApiAvailable=false;
        } else if (instnaceNumber == 3) {
          this.thirdApiAvailable=false;
        }
        else if (instnaceNumber == 4) {
          this.fourthApiAvailable=false;
        }
        else if (instnaceNumber == 5) {
          this.fifthApiAvailable=false;
        }
        console.log(error);
        return;
      }
    );
   }

   public async ConnectAPI() {
    this.api = new ripple.RippleAPI({ server: this.Config.GetRippleServer() });
    this.secondaryApi = new ripple.RippleAPI({ server: this.Config.GetRippleServer() });
    this.thirdApi = new ripple.RippleAPI({ server: this.Config.GetRippleServer() });
    //this.fourthApi = new ripple.RippleAPI({ server: this.Config.GetRippleServer() });
    //this.fifthApi = new ripple.RippleAPI({ server: this.Config.GetRippleServer() });

    if(!this.Connected) {
      await this.ConnectAPIInstance(this.api, 1);
    }
    if(!this.secondaryApiAvailable) {
      await this.ConnectAPIInstance(this.secondaryApi, 2);
    }
    if(!this.thirdApiAvailable) {
      await this.ConnectAPIInstance(this.thirdApi, 3);
    }
    
   
    //this.ConnectAPIInstance(this.fourthApi, 4);

    //this.ConnectAPIInstance(this.fifthApi, 5);
     
    return;
  }

  public async ReInit() {
    this.toaster.show('Re-Initializing to server: ' + this.Config.GetRippleServer());
    this.Connected = false;
    try {
      this.api.disconnect();
    } catch {

    }
    await this.ConnectAPI();
  }

  public async  DoesAccountExist(address) {
    try {
      const acct = await this.api.getAccountInfo(address);
      return true;
    } catch (e) {
      this.toaster.error(e.message,
          'ERROR', {
            closeButton: true,
            disableTimeOut: true
          });
      return false;
    }
  }
  public async GetXRPBalance(address) {
    try {
      const balances = await this.api.getBalances(address);
      for (let i = 0; i < balances.length; i++) {
        if (balances[i].currency === 'XRP')  {
          return balances[i].value;
        }
      }
      return 0;
    } catch (e) {
      this.toaster.error(e.message,
          'ERROR', {
            closeButton: true,
            disableTimeOut: true
          });
      return 0;
    }
  }

  public async IsSenderSecretValid(sender, secret) {
    try {
      const tx = await this.Prepare('test', sender, this.Config.DestinationAddress(), '');
      await this.SignOnly(tx, secret);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  public async SignOnly(trx, secret: string) {
    const response = this.api.sign(trx, secret);
    const txID = response.id;
  }

  public async SignAndSubmit(trx, secret: string) {
    const response = this.api.sign(trx, secret);
    let txID = response.id;

    // console.log('Identifying hash:', txID);
    const txBlob = response.signedTransaction;
    console.log('Signed blob:', txBlob);

    let submitResultInNoError = false;

    while (!submitResultInNoError) {
      const fee = await this.api.getFee();
      console.log('Fee: ' + fee);
        if (fee <= 0.000012) {
        const result = await this.doSubmit(txBlob);
        if (result === 'telINSUF_FEE_P') {
          submitResultInNoError = false;
          console.log('Fees too high, retrying');
          this.FileProgressService.ShowHighFeeNotification = true;
          this.FileProgressService.HighFeeAttemptCount++;
          const cu: ChunkingUtility = new ChunkingUtility();
          await cu.sleep(1000);
        } else if (result === 'terPRE_SEQ') {
          this.FileProgressService.ShowFatalError = true;
          this.api.disconnect();
          throw new Error('Fatal Error');
        } else if (result === 'tefPAST_SEQ') {
          txID = 'tefPAST_SEQ';
          submitResultInNoError = true; // this is really an error but handling it one tier up, refactor later
          const cu: ChunkingUtility = new ChunkingUtility();
          await cu.sleep(1000);
        } else {
          submitResultInNoError = true;
          this.FileProgressService.ShowHighFeeNotification = false;
          this.FileProgressService.HighFeeAttemptCount = 0;
        }
      } else {
        submitResultInNoError = false;
        console.log('Fees too high, retrying');
        this.FileProgressService.ShowHighFeeNotification = true;
        this.FileProgressService.HighFeeAttemptCount++;
        const cu: ChunkingUtility = new ChunkingUtility();
        await cu.sleep(1000);
      }
  }
    return txID;
  }

  public async doSubmit(txBlob) {
    const latestLedgerVersion = await this.api.getLedgerVersion();
    const result = await this.api.submit(txBlob);

    console.log('Tentative result code:', result.resultCode);
    console.log('Tentative result message:', result.resultMessage);

    this.maxLedgerVersion = latestLedgerVersion + 1;
    return result.resultCode;
  }

  public async ValidateTransaction(txToValidate, minLedgerVersion) {
    const result: GeneralResult = new GeneralResult();

    console.log('Validating Hash: ' + txToValidate);

    try {
        const tx = await this.api.getTransaction(txToValidate, {minLedgerVersion: minLedgerVersion});

        console.log('Transaction result:', tx.outcome.result);
        console.log('Balance changes:', JSON.stringify(tx.outcome.balanceChanges));
        console.log('Entire tx:');
        console.log(tx);

        result.success = true;
        result.data = tx.outcome.ledgerVersion;
    } catch (error) {
        console.log('Couldn\'t get transaction outcome:', error);
        result.success = false;
    }
    return result;
  }

  public async Prepare(objectToPrepare, sender, destination, memoType) {
    
    if (memoType === '') {
      memoType = '6e646d2d76302e39'.toUpperCase()
    }
    memoType = memoType.toUpperCase();
    const chunkingUtility = new ChunkingUtility();

    const postAsHex = chunkingUtility.StringToHex(JSON.stringify(objectToPrepare));

    const preparedTx = await this.api.prepareTransaction({
      'TransactionType': 'Payment',
      // 'Sequence': this.sequenceNumber,
      'Account': sender,
      'Amount': this.api.xrpToDrops('0.000001'),
      'Memos': [
        {
            'Memo': {
                'MemoData': postAsHex.toUpperCase(),
                'MemoType': memoType
            }
        }
      ],
      'Destination' : destination // this.Config.DestinationAddress()
      // 'Destination' : 'rwDaZS6khko4v6jEV9wgVpxMyEWw9o1JPb'
      }, {
      'maxLedgerVersionOffset': 75
    }, {fee: '0.000013'});



    this.sequenceNumber++;
    console.log('Prepared transaction sequence:' + preparedTx.instructions.sequence);
    console.log('Prepared transaction instructions:', preparedTx.txJSON);
    console.log('Transaction cost:', preparedTx.instructions.fee, 'XRP');
    console.log('Transaction expires after ledger:', preparedTx.instructions.maxLedgerVersion);
    return preparedTx.txJSON;
  }
}
