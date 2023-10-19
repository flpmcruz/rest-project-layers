import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { CustomError } from "../../domain";

export class ImageController {
  constructor() {}

  private handleError(error: any, res: Response) {
    if (error instanceof CustomError)
      return res.status(error.statusCode).json({ error: error.message });

    return res.status(500).json({ error: "Internal server error" });
  }

  getImage = (req: Request, res: Response) => {
    const { type = "", img = "" } = req.params;

    const imagePath = path.resolve(
      __dirname,
      `../../../uploads/${type}/${img}`
    );

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.sendFile(imagePath);
  };
}
