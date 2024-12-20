import * as Yup from "yup"

const getTokenByAddressSchema = Yup.object({
    params: Yup.object({
        address: Yup.string()
            .required('Address is required')
            .transform(value => value?.toLowerCase())
    })
});

export default getTokenByAddressSchema;