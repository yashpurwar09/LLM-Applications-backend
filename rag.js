import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import "cheerio";
// import { CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
});

const vectorstore = new MemoryVectorStore(embeddings);

// -------------Web base Loader---------------
// const pTagSelector = "p";
// const cheerioLoader = new CheerioWebBaseLoader(
//     "https://lilianweng.github.io/posts/2023-06-23-agent/",
//     {
//         selector: pTagSelector,
//     }
// );

// const docs = await cheerioLoader.load();

// -------------------------fs base loader from directory------------------
// const directoryPath = "./test data";
const path = "./JavaScript Interview Questions.pdf";
const loader = new PDFLoader(path, {
    splitPages: false,
    parsedItemSeparator: "",
});
const docs = await loader.load();
// const directoryLoader = new DirectoryLoader(directoryPath, {
//     ".pdf": (path)=>new PDFLoader(path,{
//         splitPages: false,
//     }),
// });
// const docs = await directoryLoader.load();

// const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
// });

// const allSplits = await splitter.splitDocuments(docs);

await vectorstore.addDocuments(docs);

// const promptTemplate = await pull("rlm/rag-prompt");
const humanMessage = "Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say the answer is not in the provided context. But the answer from internet is and provide answer according to your base knowledge of llm.\nQuestion:{question} \ncontext: {context}";
const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system","You are an assistance for question answering tasks.Analyze if it is a question realted to context. If it is not a question related to context, reply that \"It is not related to PDF.\" Also include the details from context which could frame better answer and provide more details related to question."],
    ["human","Use the following pieces of retrieved context to answer the question. If the answer is not in context, answer according to your base knowledge of llm and do not mention it is not in context.\nQuestion:{question} \ncontext: {context}"]
]);
 
const InputStateAnnotation = Annotation.Root({
    question: Annotation,
});

const StateAnnotation = Annotation.Root({
    question: Annotation,
    context: Annotation,
    answer: Annotation,
})

const retrieve = async (state)=>{
    const retrieveddocs = await vectorstore.similaritySearch(state.question);
    return { context: retrieveddocs };
};

const generate = async (state)=>{
    const docsContent = state.context.map(doc=>doc.pageContent).join("\n");
    const messages = await promptTemplate.invoke({ question: state.question, context: docsContent});    
    const response = await model.invoke(messages);
    return { answer: response.content};
};

export const graph = new StateGraph(StateAnnotation)
.addNode("retrieve", retrieve)
.addNode("generate", generate)
.addEdge("__start__", "retrieve")
.addEdge("retrieve", "generate")
.addEdge("generate", "__end__")
.compile();

