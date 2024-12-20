import * as Yup from "yup"

const commentCreateSchema = Yup.object({
    body: Yup.object({
        content : Yup.string().required(),
        address : Yup.string().required(),
    }).noUnknown()
});

export default commentCreateSchema;
