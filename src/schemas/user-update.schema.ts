import * as Yup from "yup"

const userUpdateSchema = Yup.object({
    body: Yup.object({
        username: Yup.string().optional(),
        avatar: Yup.string().optional(),
        description: Yup.string().optional(),
    }).noUnknown()
});

export default userUpdateSchema;
