# Storyweaver Creator Collective

PROJECT: CREA-LINK

Complete Application Integration, User Experience & Visual Design

You are working on Crea-Link, a creative collaboration platform designed to connect creators and help storytellers develop their ideas with AI assistance.

I am providing six ZIP files containing six independently developed modules. Your task is to integrate these modules into ONE complete, connected, functional web application.

This is an integration task, not a request to build six separate pages or unnecessarily recreate everything from scratch.

1. THE CORE VISION

Crea-Link has TWO primary purposes:

A. Creator Collaboration

Creators should be able to discover other talented people, connect with them, form teams, create projects, and collaborate in a shared creative environment.

B. AI-Powered Storytelling Assistance

Storytellers should have an AI-powered helping hand that assists them with developing, improving, researching, and expanding their stories while keeping the writer in control of their creativity.

Every part of the application should support one or both of these purposes.

2. COMPLETE USER JOURNEY — FOLLOW THIS SEQUENCE

STEP 1 — LANDING PAGE

Create the first page visitors see when they open Crea-Link.

Include:

- Crea-Link branding and introduction.
- A clear explanation of the platform.
- Its two main purposes: creator collaboration and AI storytelling assistance.
- A section highlighting the main features.
- Sign Up and Log In buttons.

STEP 2 — SIGN UP AND LOG IN

Users should be able to:

- Register for an account.
- Log in to an existing account.
- Access their account securely.
- Continue to profile setup after successful registration.

Use the existing authentication implementation if provided. Do not create fake authentication or pretend sample accounts are real users.

STEP 3 — PROFILE CREATION

After registration, guide users through creating their profiles.

Allow users to add:

- Profile picture.
- Full name.
- Username.
- Bio.
- Creative interests.
- Skills and expertise.
- Preferred genres.
- Creator type, such as writer, animator, filmmaker, designer, artist, or researcher.

Save profile information and make it available throughout the platform.

After completing the profile, take the user to the main dashboard.

STEP 4 — MAIN DASHBOARD AND CREATOR FEED

The dashboard should become the central place for users.

Create a feed where users can:

- Discover other creators.
- Explore their profiles and creative work.
- View shared projects and posts.
- Find people with similar interests.
- Search for creators and creative projects.

Integrate the Creator Discovery module here.

The feed should feel like an active creative community, not a static demonstration with permanently displayed sample users.

STEP 5 — CREATIVE PROJECTS AND COLLABORATIVE STUDIO

This is one of the most important parts of Crea-Link.

Users should be able to create a new project or join an existing project.

Project creation should support:

- Project title.
- Project description.
- Project genre through selectable categories.
- Script upload or text entry.
- Project editing and renaming.

Users should be able to invite or collaborate with other creators.

Inside each project, provide a shared collaborative workspace where members can:

- Communicate through group chat.
- Share messages.
- Share images and videos.
- Exchange project-related materials.
- Work together on creative projects.

Preserve the existing collaboration and messaging functionality from the provided modules.

STEP 6 — AI STORY ASSISTANT

This is one of the TWO CORE FEATURES of Crea-Link.

The AI Story Assistant must be connected to the storyteller's creative workflow.

It should help writers with:

- Plot development.
- Character development.
- Dialogue improvement.
- Story structure.
- World-building.
- Creative blocks.
- Scene development.
- Story consistency.
- Alternative creative possibilities.

The writer should be able to provide their own ideas, scripts, or story information and receive useful assistance.

The AI must act as a creative partner, not take control of the story or replace the writer's imagination.

IMPORTANT: Make the AI Story Assistant accessible from inside the Collaborative Studio so writers can get assistance without leaving their projects.

Preserve the existing AI implementation and connect it to actual project context wherever technically possible.

STEP 7 — RESEARCH ASSISTANT

Integrate the Research module into the storytelling workflow.

It should help writers research topics related to:

- Story genres.
- Historical settings.
- Characters and professions.
- Locations and cultures.
- Scientific concepts.
- Real-world events.
- Other subjects relevant to their stories.

Preserve the existing research functionality.

If the module uses external search platforms, maintain that functionality. Do not falsely represent external search links as an integrated AI research engine.

STEP 8 — CREATOR DISCOVERY AND CONNECTION

Users should be able to discover potential collaborators through:

- Skills.
- Creative interests.
- Genres.
- Creator profiles.
- Shared projects and work.

Allow users to explore creators and connect with people they may want to collaborate with.

Integrate Creator Discovery into the overall feed and navigation rather than treating it as a separate application.

STEP 9 — PROFILE AND ACCOUNT MANAGEMENT

Users should be able to:

- View their own profiles.
- Edit their information.
- View their projects.
- Access their collaborations.
- Manage their account.

3. MAIN APPLICATION NAVIGATION

Create one consistent navigation system.

The main navigation should provide access to:

1. Home / Feed
2. Discover Creators
3. Creative Projects
4. Collaborative Studio
5. AI Story Assistant
6. Research
7. My Profile

Navigation should be clear and consistent across the application.

Users must not feel as if they are switching between six unrelated websites.

4. VISUAL DESIGN — IMPORTANT

Crea-Link must have a modern, elegant, minimalistic, smooth, and visually appealing interface.

Do not create a basic-looking dashboard with plain buttons and boxes. The application should feel like a polished creative platform.

Overall design language

- Use a predominantly light-colour interface.
- Use white, off-white, and very light pastel backgrounds.
- Use soft, elegant colour combinations.
- Maintain generous spacing and clean layouts.
- Use modern typography with clear visual hierarchy.
- Use rounded cards, subtle borders, and soft shadows where appropriate.
- Maintain consistency across every module.
- Avoid overly saturated colours, harsh contrasts, and visually exhausting backgrounds.
- Ensure text remains readable and accessible.

Smooth animations and interactions

Add tasteful, smooth animations throughout the application.

Examples:

- Smooth page transitions.
- Subtle hover effects on cards and buttons.
- Gentle fade-in and slide-in animations.
- Smooth dropdown and modal transitions.
- Animated loading states.
- Responsive feedback when users interact with elements.
- Subtle transitions when switching between sections.

Animations should feel natural, polished, and lightweight. Do not make the interface slow, distracting, or difficult to navigate.

Genre-Based Dynamic Colour Theme — SPECIAL FEATURE

Crea-Link should adapt its visual accent palette according to the writer's selected story genre.

The colours must remain very light, soft, pastel, and low-saturation, as if the original colour were seen through a thin layer of white-painted glass.

The interface should never become dark, aggressive, or excessively colourful.

Use these genre-based palettes:

Story genre / Theme| Suggested colour palette
Love, romance, relationships| Soft pastel pink and lavender
Peaceful, calming, soothing stories| Pale sky blue and soft blue
Morality, social awareness, peace, humanity| Light sage green and mint
Adventure, exploration, action, battles and epic journeys (for example, One Piece-style adventures)| Soft pastel orange and peach
Revenge, psychology, cruelty, horror, darker sides of society| Very light pastel red, rose, and muted blush red

How the dynamic theme should work

1. During project creation, the writer selects the story genre.
2. The application identifies the corresponding colour palette.
3. The project's interface adapts to that palette.
4. Relevant project sections, cards, buttons, highlights, and subtle backgrounds use the selected colours.
5. When a user opens a different project, its corresponding theme should be applied.
6. The main application structure and readability should remain consistent.

For example:

- Opening a romance project should create a soft pink and lavender atmosphere.
- Opening a peaceful story should create a calm blue atmosphere.
- Opening a social-awareness project should create a gentle green atmosphere.
- Opening an adventure project should create a warm peach and orange atmosphere.
- Opening a psychological horror or revenge project should create a subtle red atmosphere.

Important design distinction: The colour theme should adapt to the individual project, not permanently change the entire platform for every user. The overall Crea-Link interface should remain predominantly white and minimalist.

If a project has multiple genres, allow the primary genre to determine its main accent palette.

The colour system should be implemented consistently using reusable theme variables or design tokens, rather than manually changing colours on individual pages.

5. INTEGRATION INSTRUCTIONS FOR THE SIX ZIP FILES

Before changing the project:

1. Inspect all six ZIP files.
2. Identify the framework, programming languages, dependencies, components, assets, and functionality in each module.
3. Understand what each module does.
4. Map each module to the appropriate stage of the user journey.
5. Identify conflicting dependencies, duplicate components, incompatible routing systems, and styling conflicts.

Then integrate the modules into one application.

Important rules

- Preserve existing working code and functionality wherever possible.
- Do not unnecessarily rewrite modules that already work.
- Do not discard useful features just to simplify integration.
- Reuse existing components, assets, and designs where practical.
- Establish one consistent application structure and navigation system.
- Connect modules so information and user context can flow between relevant features.
- Avoid duplicate login systems and disconnected user profiles.
- Maintain consistent visual design throughout the application.
- Apply the genre-based colour system without breaking existing functionality.

6. FUNCTIONALITY AND HONEST TESTING

Do not build a website that only looks functional.

Check that:

- Registration and login work with the actual authentication implementation.
- User profiles can be created and saved.
- The feed displays available creator and project information.
- Creator discovery works with available data.
- Projects can be created and accessed.
- Collaboration features are connected to the appropriate project.
- Group messaging uses the available backend rather than fake local-only messages.
- The AI Story Assistant can actually process user input if its AI service is configured.
- Research functionality works according to its existing implementation.
- Navigation between all modules works.
- Genre-based themes change correctly between projects.
- Animations work smoothly without affecting usability.
- The application builds without errors.

Do not claim that real-time messaging, multi-user collaboration, persistent storage, or AI integration works unless the implementation supports it.

If a feature requires missing API keys, backend configuration, environment variables, or external permissions, identify the exact missing requirement. Do not silently replace it with a fake demonstration.

7. PRIORITY: COMPLETE THE INTEGRATION

I have limited development credits and a short submission deadline.

Therefore:

1. Prioritize integrating the six existing modules.
2. Prioritize the complete user journey.
3. Prioritize working navigation and essential functionality.
4. Reuse existing code instead of rebuilding everything.
5. Implement the visual design and genre-based colour system consistently.
6. Add smooth, lightweight animations without compromising performance.
7. Avoid unnecessary decorative features and unrelated additions.
8. Avoid repeatedly generating alternative designs.
9. Do not spend credits on explanations or plans when you can implement the actual integration.

If a module cannot be integrated because its files or dependencies are missing, explain the exact problem rather than pretending it has been integrated.

If full backend integration is not possible with the provided files, complete the usable frontend integration and clearly identify the remaining backend requirements.

FINAL EXPECTATION

Deliver ONE unified application called Crea-Link.

The final experience should follow this journey:

Landing Page → Sign Up / Log In → Profile Creation → Creator Feed → Discover Creators → Create or Join a Project → Collaborative Studio → AI Story Assistant and Research Assistant.

The two central experiences must be:

1. Creators finding each other and collaborating on creative projects.

2. Storytellers receiving AI assistance throughout their creative process.

The visual experience should be light, elegant, minimalistic, smooth, easy to navigate, and dynamically themed according to each project's genre.

Do not treat these as unrelated features. They must work together inside one creative ecosystem.

Start by inspecting all six uploaded ZIP files, then proceed with integration and implementation. Preserve existing work and prioritize a functional, unified Crea-Link application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://storyweaver-creator-collective.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5730f5e6-eb51-4301-8260-b46ec9b49b2c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
