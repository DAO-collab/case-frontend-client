import { FormModel } from '../pages/forms/models/FormModel';

export interface IForms {
  getFormInfo(caseId: string, formId: string): any;
  createForm(caseId: string, request: FormModel): any;
  postFormMedia(caseId: string, formId: string, mediaId: string, tagId: string): any;
  updateForm(caseId: string, request: FormModel, formId: string): any;
}
