import { Module } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { GeneralLedgerService } from './general-ledger.service';

@Module({
  providers: [
    AccountsService,
    GeneralLedgerService,
    AccountsResolver,
    AuditService,
  ],
  exports: [AccountsService, GeneralLedgerService],
})
export class AccountsModule {}
