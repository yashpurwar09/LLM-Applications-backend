// import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
    Annotation,
} from "@langchain/langgraph";
import { v4 as uuidv4} from "uuid";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { filterMessages } from "@langchain/core/messages";
import PromptSync from "prompt-sync";
import dotenv from "dotenv";


dotenv.config();
// console.log(process.env.OPENAI_API_KEY);

// Create Instance of Model.
// const model = new ChatOpenAI({
//     model: "gpt-4o-mini",
//     apiKey: ,
//     temperature: 0,
// });

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
    temperature: 0.7,
});

// Create prompt template using "ChatPromptTemplate.fromMessages()" for the model as input by formatting User raw input 
const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a helpful assistance. Answer all questions to the best of your ability in {language}.",
        // "You are an interviewer."
    ],
    [   "placeholder", 
        "{messages}",
    ],
]);

const GraphAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    language: Annotation(),
});

// Create a function to call the model
const callModel = async (state)=>{ 
    // const response = promptTemplate.pipe(model);
    const prompt = await promptTemplate.invoke(state);
    const response = await model.invoke(prompt);
    return {messages: response};
};

// Create a graph using StateGraph() instance imported from langgraph
const workflow = new StateGraph(GraphAnnotation)
.addNode("model",callModel)
.addEdge(START,"model")
.addEdge("model", END);

// Create a memory instance to attach with the graph compiler as checkpoint
const memory = new MemorySaver();
const app = workflow.compile({checkpointer: memory});

// Create a config to pass to the workflow of graph along with input
const config = { configurable: { thread_id : uuidv4()}};

// Take input form user
// ----const prompt = PromptSync();
// const userInput = prompt("Hi, how may I help you.");
// console.log(userInput);
 
// ----do {
//     console.log("========================================================================================");
//     const userInput = prompt();
export async function chat(userInput){
    const input = {
        messages: [
            {
                role: "user",
                // content: "Give roadmap for full stack developer.",
                content: userInput,
            },
        ],
        language: "English",
    };
    
    // Invoke the workflow with input and config as parameters
    const output = await app.invoke(input, config);
    for (const msg of output.messages){
        console.log(msg.getType());
        console.log("===================================");  
    };
    
    
    return output.messages;
};
    // console.log("========================================================================================");
    // console.log(output.messages[output.messages.length-1].content);

// ----} while (true);
// Input 1
// Create input to the workflow 
// const input = {
//     messages: [
//         {
//             role: "user",
//             // content: "Give roadmap for full stack developer.",
//             content: userInput,
//         },
//     ],
//     language: "English",
// };

// // Invoke the workflow with input and config as parameters
// const output = await app.invoke(input, config);
// console.log(output.messages[output.messages.length-1].content);

// // Input 2
// const input2 = {
//     messages: [
//         {
//             role: "user",
//             content: "Can you suggest me other prompt?",
//         }
//     ],
//     language: "English",
// };
// const output2 = await app.invoke(input2, config);
// console.log(output2.messages[output2.messages.length-1].content);





