'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocField } from '@/types';
import { DataField } from './fields/DataField';
import { TextField } from './fields/TextField';
import { TextEditorField } from './fields/TextEditorField';
import { SelectField } from './fields/SelectField';
import { CheckField } from './fields/CheckField';
import { DateField } from './fields/DateField';
import { DatetimeField } from './fields/DatetimeField';
import { CurrencyField } from './fields/CurrencyField';
import { FloatField } from './fields/FloatField';
import { IntField } from './fields/IntField';
import { LinkField } from './fields/LinkField';
import { TableField } from './fields/TableField';
import { AttachField } from './fields/AttachField';
import { ColorField } from './fields/ColorField';
import { RatingField } from './fields/RatingField';
import { SignatureField } from './fields/SignatureField';

interface FormFieldProps {
  field: DocField;
  readOnly?: boolean;
}

export function FormField({ field, readOnly = false }: FormFieldProps) {
  const {
    formState: { errors },
  } = useFormContext();

  const error = errors[field.fieldname];
  const isRequired = field.reqd;
  const isReadOnly = readOnly || field.readonly;
  const isHidden = field.hidden;

  if (isHidden) {
    return null;
  }

  const commonProps = {
    field,
    error: error?.message as string,
    required: isRequired,
    readOnly: isReadOnly,
  };

  const renderField = () => {
    switch (field.fieldtype) {
      case 'Data':
        return <DataField {...commonProps} />;
      case 'Text':
        return <TextField {...commonProps} />;
      case 'Text Editor':
        return <TextEditorField {...commonProps} />;
      case 'Select':
        return <SelectField {...commonProps} />;
      case 'Check':
        return <CheckField {...commonProps} />;
      case 'Date':
        return <DateField {...commonProps} />;
      case 'Datetime':
        return <DatetimeField {...commonProps} />;
      case 'Currency':
        return <CurrencyField {...commonProps} />;
      case 'Float':
        return <FloatField {...commonProps} />;
      case 'Int':
        return <IntField {...commonProps} />;
      case 'Link':
        return <LinkField {...commonProps} />;
      case 'Table':
        return <TableField {...commonProps} />;
      case 'Attach':
        return <AttachField {...commonProps} />;
      case 'Color':
        return <ColorField {...commonProps} />;
      case 'Rating':
        return <RatingField {...commonProps} />;
      case 'Signature':
        return <SignatureField {...commonProps} />;
      default:
        return <DataField {...commonProps} />;
    }
  };

  return (
    <div className="space-y-1">
      {renderField()}
    </div>
  );
}