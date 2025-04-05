import { loginSchema } from "../validators/auth.validator.js"
import { login } from "../services/auth.service.js"

export const loginUser = async (req, res, next) => {
  try {
    const { email, senha } = loginSchema.parse(req.body)
    const result = await login(email, senha)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
