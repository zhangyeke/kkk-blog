import React from "react";
import {
    AutoFormUIComponents, AutoForm as BaseAutoForm,
} from "@autoform/react";
import {AutoFormProps} from "./types";
import {Form} from "./components/Form";
import {FieldWrapper} from "./components/FieldWrapper";
import {ErrorMessage} from "./components/ErrorMessage";
import {SubmitButton} from "./components/SubmitButton";
import {StringField} from "./components/StringField";
import {NumberField} from "./components/NumberField";
import {BooleanField} from "./components/BooleanField";
import {DateField} from "./components/DateField";
import {SelectField} from "./components/SelectField";
import {RemoteSelect} from "./components/RemoteSelectField";
import {ObjectWrapper} from "./components/ObjectWrapper";
import {ArrayWrapper} from "./components/ArrayWrapper";
import {ArrayElementWrapper} from "./components/ArrayElementWrapper";
import {MarkedField} from "./components/MarkedField"
import {TextareaField} from "./components/TextareaField"
import UploadFileField from "./components/UploadFileField"
import {ImageUploadField} from "./components/ImageUploadField"


const ShadcnUIComponents: AutoFormUIComponents = {
    Form,
    FieldWrapper,
    ErrorMessage,
    SubmitButton,
    ObjectWrapper,
    ArrayWrapper,
    ArrayElementWrapper,

};

export const ShadcnAutoFormFieldComponents = {
    string: StringField,
    number: NumberField,
    boolean: BooleanField,
    date: DateField,
    select: SelectField,
    remoteSelect: RemoteSelect,
    markdown: MarkedField,
    textarea: TextareaField,
    uploadFile: UploadFileField,
    imageUpload: ImageUploadField
} as const;
export type FieldTypes = keyof typeof ShadcnAutoFormFieldComponents;

export function AutoForm<T extends object>({
                                               uiComponents,
                                               formComponents,
                                               formProps,
                                               ...props
                                           }: AutoFormProps<T>) {

    return (
        <BaseAutoForm
            {...props}
            formProps={{
                noValidate: true,
                ...formProps
            }}
            uiComponents={{...ShadcnUIComponents, ...uiComponents}}
            formComponents={{...ShadcnAutoFormFieldComponents, ...formComponents}}
        />
    );
}
