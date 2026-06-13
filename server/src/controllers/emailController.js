import { getEmailStatus } from "../services/emailService.js";
import { getUserId } from "../services/notificationService.js";

export async function getMyEmailStatus(req, res, next) {
  try {
    const status = await getEmailStatus(getUserId(req.user));
    res.json(status);
  } catch (error) {
    next(error);
  }
}
