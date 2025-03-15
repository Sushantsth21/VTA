# Virtual Teaching Assistant (VTA) Chatbot

## Overview
The **Virtual Teaching Assistant (VTA) Chatbot** is an AI-powered chatbot designed to assist students in the **MCY 660 (Cybersecurity Risk Management)** master's level course. The chatbot leverages **OpenAI, RAG (Retrieval-Augmented Generation), Pinecone, Canvas API, and MongoDB** for chat history storage. It provides students with real-time assistance, answering their queries and improving their learning experience.

## Features
- **AI-driven Responses**: Utilizes OpenAI's model to generate intelligent and context-aware answers.
- **RAG-based Retrieval**: Enhances chatbot accuracy by fetching relevant information from course materials.
- **Pinecone for Vector Search**: Efficiently retrieves stored knowledge for more precise responses.
- **Canvas API Integration**: Extracts relevant course-related data.
- **MongoDB for Chat History**: Stores student interactions to maintain context and improve responses.
- **Two-Step Model**:
  - **Step 1:** Preprocesses the query, removing stopwords and checking for errors.
  - **Step 2:** Fetches relevant content from course PDFs and other materials for accurate answers.

## Tech Stack
- **Frontend**: Deployed on [Vercel](https://vta-brown.vercel.app)
- **Backend**: Typescript, Next.js
- **Database**: MongoDB (for chat history)
- **AI Framework**: OpenAI (ChatGPT), Retrieval-Augmented Generation (RAG)
- **Search Engine**: Pinecone (for vector database indexing and retrieval)
- **APIs Used**: Canvas API

## Research Questions
As part of the evaluation, we are analyzing the chatbot's effectiveness through the following research questions:
1. How satisfied are students with the responses provided by the chatbot to their queries?
2. How does students' perception or attitude toward the chatbot change before and after using it?
3. How likely are students to use this chatbot again in the future?
4. Have students used any other generative AI models (ChatGPT, Claude, Perplexity) as a teaching assistant?
5. Did the chatbot help students better understand the course material?

### Feedback Questions
- What is one thing you liked most about the chatbot?
- What is one thing you would improve?
- Did you encounter any problems while using the chatbot?

## Deployment
The chatbot is currently deployed and accessible at: [VTA Chatbot](https://vta-brown.vercel.app)

## Contributors
- Gaurab Baral
- Sushant Shrestha
- Mith Sah

## References
- [CoVerifi: A COVID-19 news verification system - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2468696421000070)
- [Computational Media Lab - CoVerifi](https://www.computationalmedialab.com/project/coverifi/)
- [GitHub - CoVerifi](https://github.com/nlkolluri/CoVerifi)

## License
This project is licensed under the MIT License.
