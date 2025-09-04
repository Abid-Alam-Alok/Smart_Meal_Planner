import express from "express"

const router = express.Router();


router.get("/", (req,res) => {
    res.status(200).send("Fetching the nodes");
});

router.post("/", (req,res) => {
    res.status(201).send({ message: "Creating a new note" });
});

router.put("/:id", (req,res) => {
    res.status(201).send({ message: "Updating a new note" });
});

router.delete("/:id", (req,res) => {
    res.status(201).send({ message: "Deleting a new note" });
});

export default router;