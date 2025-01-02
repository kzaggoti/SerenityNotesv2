# AI-Powered Journaling App

An AI-driven journaling application designed to help users track their thoughts, gain personal insights, and work toward their goals. This app leverages **Firebase** for database and authentication, supports **voice-based** journal entries, and integrates **OpenAI’s GPT-4** (via a mini API) for personalized advice, motivation, and counselor-like interactions.

## Table of Contents

1. [Features](#features)  
   1. [Authentication](#authentication)  
   2. [Journaling](#journaling)  
   3. [Advice & Insights](#advice--insights)  
   4. [Goals & Reflection](#goals--reflection)  
   5. [Motivation & Counselor](#motivation--counselor)  
2. [Technical Overview](#technical-overview)  

---

## Features

### Authentication
- **Firebase-based Authentication**: Users can sign up and log in using their email/password or via **Google Sign-In**.
- **Secure**: All authentication flows and user data are managed by Firebase’s secure platform.

### Journaling
- **Create Journal Entries**: Users can add entries with a **header** and the main text.  
- **Voice Support**: Optionally speak journal entries instead of typing them, using integrated voice-to-text functionality.  
- **Monthly Organization**: Each entry is automatically categorized into a folder for the corresponding month.  
- **Pin, Edit, or Delete**: From the three-dot menu on an entry, users can:
  - **Pin** an entry to keep it at the top of the month’s folder and also add it to a “Favorites” folder.
  - **Edit** content to update or revise the entry.
  - **Delete** the entry from their journal.

### Advice & Insights
- **User Survey Data**: Upon first sign-up, users complete a brief survey (e.g., identity, stress level, coping strategies, faith, etc.). This data is stored and used to personalize advice and insights.  
- **OpenAI GPT-4 Integration**: Recent journal entries and survey data feed into GPT-4 to generate **personalized insights**.  
- **High Quality Recorded Data**: The data from the survey and journal is leveraged in the Advice module to tailor suggestions and coping strategies.

### Goals & Reflection
- **Goal Creation**: Users can set goals with a timeframe to achieve them.  
- **Progress Updates**: Adjust the progress on each goal over time.  
- **Reflection**: Once the timeframe ends, the user writes a reflection. This reflection is stored and used for future motivation and counseling prompts.

### Motivation & Counselor
- **Personalized Motivation**: Quotes and motivational messages that reflect the user’s goals, habits, or recent journaling topics.  
- **Counselor Chat**: A chatbot powered by OpenAI, using the user’s survey data and journaling history. This AI counselor offers empathetic responses, coping strategies, and well-being tips.

---

## Technical Overview

1. **Backend & Auth**  
   - **Firebase** for Authentication (email/password, Google), database (Firestore), and hosting certain functionalities.  
   - User data (entries, preferences, survey responses) is stored in secure Firebase collections.

2. **AI & Language Processing**  
   - **OpenAI GPT-4** mini API for personalized insights, motivations, and counselor chat.  
   - Prompt engineering ensures the chatbot behaves in a counselor-like manner, referencing stored user data for context.

3. **Voice-to-Text**  
   - Uses browser or device-specific APIs (e.g., Web Speech API) to capture and transcribe speech into text for journal entries.

4. **Data Organization**  
   - Each journal entry is labeled with date/time and placed in monthly folders.  
   - Pinned entries are also flagged as “favorites.”

5. **Survey Data**  
   - Collected once during onboarding and stored for repeated usage in Insights, Counselor, and Motivation modules.

---

