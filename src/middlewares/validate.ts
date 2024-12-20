import { AnySchema } from "yup"
import { Request, Response, NextFunction } from "express"

/**
 * Middleware to validate a request against a schema.
 * @param schema The schema to validate against.
 * @returns A middleware function that validates the request.
 */
export default function validate(schema: AnySchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.validate({
                body: req.body,
                query: req.query,
                params: req.params,
            })

            const { params, query, body } = schema.cast({
                params: req.params,
                query: req.query,
                body: req.body,
            })

            req.params = params
            req.query = query
            req.body = body

            return next()
        } catch (err) {
            return res.status(400).json({
                message: "Validation Error",
                errors: err.errors,
            })
        }
    }
}