import * as Yup from "yup"

const tokenCreateSchema = Yup.object({
    body: Yup.object({
        address: Yup.string().required(),
        twitter: Yup.string().optional(),
        telegram: Yup.string().optional(),
        website: Yup.string().optional(),
        max_buy: Yup.string().optional(),
    }).noUnknown()
});

export default tokenCreateSchema;
