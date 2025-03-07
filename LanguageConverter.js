import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config()


// const model = new ChatOpenAI({
//     model: "gpt-4o-mini",
//     apiKey: "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",
// });

export const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.7,
})

// const messages = [
//     new SystemMessage("Translate the following from English to Italian"),
//     new HumanMessage("hi!")
// ];
export default async function lc(text, language){
const systemTemplate = "Translate the following {text} to {language} and only provide translation as output.";

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "{text}"],
]);


    const promptValue = await promptTemplate.invoke({
        language: language,
        text: text,
    });
    const output = await model.invoke(promptValue);
    return output['content'];
    }

