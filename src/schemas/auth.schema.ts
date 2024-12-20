import * as Yup from "yup"

const authSchema = Yup.object({
    body: Yup.object({
        wallet: Yup.string().required(),
        signature: Yup.string().required()
    }).noUnknown()
});

export default authSchema;