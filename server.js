import express from "express";
import cors from "cors";
import lc from "./LanguageConverter.js"
import { chat } from "./index.js";
import { graph } from "./rag.js"

const app = express();
app.use(cors());
app.listen(3000, ()=>{
    console.log("app is running");
    
});

app.get("/", async (req, res)=>{
    const chatmsg = req.query.chatmsg;
    if(chatmsg){
        const output = await chat(chatmsg);
        res.send(output);
    }
});

app.get("/rag", async (req, res)=>{
    let inputs = { question: req.query.question};
    if(inputs){
    const result = await graph.invoke(inputs);
    res.send(result['answer'])
    }
})

app.get("/LangConverter", async (req, res)=>{
    const output = await lc(req.query.text, req.query.language);
    res.send(output);
})