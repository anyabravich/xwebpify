import express from "express";
import multer from "multer";
import { unlink } from "fs";
import { promisify } from "util";
import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";
import archiver from "archiver";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());

app.use(express.json());

const upload = multer({ dest: "uploads/" });

const unlinkAsync = promisify(unlink);

app.post("/api/upload", upload.array("photos"), async (req, res) => {
  try {
    const files = req.files;

    const paths = files.map((file) => file.path);

    const convertedPaths = await Promise.all(
      paths.map(async (path, i) => {
        const output = `webp/${files[i].filename}.webp`;
        await imagemin([path], {
          destination: "./webp/",
          plugins: [
            imageminWebp({
              quality: 90,
            }),
          ],
        });
        await unlinkAsync(path);
        return output;
      })
    );

    const zip = archiver("zip");
    convertedPaths.forEach((path) => {
      const name = path.split("/").pop();

      if (name) {
        zip.file(path, { name });
      }
    });
    zip.pipe(res);
    zip.finalize();
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).send("Error processing files");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
