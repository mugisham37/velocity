import { Module } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { AccountsReceivableResolver } from './accounts-receivable.resolver';
import { AccountsReceivableService } from './accounts-receivable.service';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { BankingService } from './banking.service';
import { GeneralLedgerService } from './general-ledger.service';

@Module({
  providers: [
    AccountsService,
    GeneralLedgerService,
    AccountsReceivableService,
    BankingService,
    AccountsResolver,
    AccountsReceivableResolver,
    AuditService,
  ],
  exports: [
    AccountsService,
    GeneralLedgerService,
    AccountsReceivableService,
    BankingService,
  ],
})
export class AccountsModule {}
