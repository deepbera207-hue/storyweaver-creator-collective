
Crea-Link --- Creative Collaboration & AI Storytelling Platform
Find your people. Grow your story.

Crea-Link is a creative collaboration platform designed to bring
writers, animators, filmmakers, designers, artists, music producers,
content creators, and researchers into one shared creative workspace.
It combines creator discovery and project collaboration with an AI
Story Assistant that helps writers develop their own ideas without
taking authorship away from them.

Table of Contents
1. Project Overview
2. The Problem Crea-Link
   Addresses
3. Core Vision
4. Who Crea-Link Is For
5. Complete User Journey
6. Features in Detail
   - Landing Page
   - Authentication and
     Onboarding
   - Creator Profiles
   - Home Feed
   - Discover Creators
   - Creative Matchmaking
   - Creative Projects
   - Collaborative Studio
   - AI Story Assistant
   - Research Studio
   - Requests, Connections, and
     Collaborations
   - Genre-Based Visual Themes
   - Responsive Experience and App
     Metadata
7. Project Workspace: Every
   Section
8. Technology Stack
9. Application Architecture
10. Database and Backend
11. Security and Access Control
12. External Services and
    Configuration
13. Routes and Navigation Map
14. Local Development Setup
15. Environment Variables
16. Testing and Quality Checks
17. Current Scope and Important
    Limitations
18. Planned Improvements
19. Repository Structure
20. Project Philosophy
1. Project Overview
Project name: Crea-Link
Category: Creative collaboration, creator community, and AI-assisted
storytelling
Application type: Web application
Primary audience: Independent creators and people who want to
develop creative projects together.

Crea-Link is built around two connected experiences:
A. Creator Collaboration
Creators can build a profile, discover people with complementary
creative skills, explore projects, send collaboration requests, create
or join projects, and work together in a project-specific studio.
B. AI-Assisted Storytelling
Writers can bring an idea, premise, or draft to the AI Story Assistant.
The assistant can suggest directions for plot, characters, dialogue,
structure, scenes, world-building, consistency, and more. Writers remain
in control: they can accept, reject, revise, or ignore suggestions.

These experiences are connected. A writer can develop a story, find
people with the skills needed to bring it to life, and work with them in
a shared project workspace.
2. The Problem Crea-Link Addresses
Creative projects often require more than one skill. A story may need a
writer, animator, character designer, storyboard artist, sound designer,
music producer, video editor, or filmmaker. Finding the right people and
keeping their work organized can become difficult when discovery,
communication, scripts, files, and planning happen in separate places.

Writers can also reach a point where they need another perspective: a
plot feels weak, a character lacks motivation, dialogue feels unnatural,
or the next scene is unclear.

Crea-Link brings these parts of the creative process into one platform:
- Find people: discover creators by craft, skills, interests,
  genre, experience, and availability.
- Form teams: connect with creators and invite people into
  projects.
- Build together: keep project scripts, conversations, media,
  tasks, milestones, and finished work in a shared workspace.
- Develop stories: use AI-generated suggestions as optional
  creative input, not as a replacement for the writer.
- Research ideas: prepare focused research prompts and open
  external research platforms.
3. Core Vision
Crea-Link is not intended to be just another social feed or just another
AI writing tool.

It is designed as a connected creative environment:

A creator has an idea → develops a project → finds collaborators →
builds a team → shares scripts and references → plans work →
communicates → develops the story with optional AI assistance → presents
the finished creative work.

The platform follows one central principle:
AI should support human creativity, not replace the human creator.

The writer makes the creative decisions. The collaborators bring
different skills. Crea-Link provides the space and tools that help them
work together.
4. Who Crea-Link Is For
Crea-Link supports several creator categories:
  Creator category                   Example work and skills
  Writer / Storyteller               Scripts, plots, characters,
fictional worlds, story
development

  Animator                           Animation, illustration, motion
graphics, visual storytelling

  Filmmaker                          Directing, cinematography, short
films, screen storytelling

  Designer                           Character design, visual
development, posters, UI and
graphics

  Artist                             Illustration, concept art, comics,
painting

  Researcher                         Historical research,
fact-checking, cultural
consulting, science advice

  Music Producer                     Soundtracks, beats, background
scores, audio production
Content Creator                    Video editing, digital content,
visual production
Project teams can also use more specific creative roles, including 3D
Artist, Character Designer, Sound Designer, Video Editor, Voice Actor,
Storyboard Artist, Background Artist, and Director.
5. Complete User Journey
The application is organized around this journey:
1. Landing page --- visitors understand what Crea-Link does.
2. Sign up or log in --- users create an account or access an
   existing one.
3. Profile onboarding --- new users introduce themselves and
   describe their creative skills and interests.
4. Home feed --- users see creators and projects from the
   community.
5. Discover creators --- users search and filter potential
   collaborators.
6. Creative matchmaking --- users describe the kind of collaborator
   they need and see creators ranked using transparent compatibility
   rules.
7. Create or join a project --- users start a project or explore
   open opportunities.
8. Collaborative Studio --- project members share scripts,
   communicate, manage tasks, and organize creative materials.
9. AI Story Assistant --- writers get optional story-development
   suggestions using their draft and project context.
10. Research Studio --- writers prepare a research question and open
    an external research platform.
11. Profile and collaboration management --- users maintain their
    creator identity and manage requests and collaborations.
6. Features in Detail
6.1 Landing Page
The landing page introduces Crea-Link and communicates its two central
purposes: creator collaboration and AI-assisted storytelling.

It includes:
- Crea-Link branding and a short platform introduction.
- A clear headline: "Find your people. Grow your story."
- Sign-up and log-in entry points.
- A feature overview covering creator discovery, projects,
  collaboration, AI assistance, research, and genre-based project
  themes.
- Visual cards representing different story moods and genres.
- A short explanation of how the two core experiences work together.
The landing page changes its primary call to action depending on whether
a user is already signed in.
6.2 Authentication and Onboarding
Crea-Link uses Supabase authentication and a profile-onboarding flow.

The authentication interface provides:
- Email and password registration.
- Email and password sign-in.
- Password reset by email.
- Google sign-in through the configured Lovable authentication
  integration.
- Lovable sign-in through the configured Lovable authentication
  integration.
After registration, the database creates a starter profile row for the
new account. The user is then guided through onboarding before entering
the main authenticated application.

Authenticated routes check the user's session. Users without a valid
session are redirected to the authentication page. Users who have not
completed onboarding are directed to profile setup.

Important: OAuth providers, email confirmation, redirect URLs, and
Supabase project settings must be configured correctly in the connected
backend for those flows to work in a deployed environment.
6.3 Creator Profiles
A creator profile is intended to explain both who someone is and what
they can contribute to a project.

Profile information includes:
- Profile picture.
- Full name.
- Username.
- Bio and short tagline.
- Location.
- Creator type.
- Creative genres.
- Skills.
- Interests.
- Experience level.
- Years of experience.
- Availability.
- Collaboration preferences.
- Types of collaborators the user is looking for.
- Studio role.
The profile is used throughout the platform for creator cards,
discovery, matching, project teams, and collaboration workflows.

Users can view and edit their own profile. Other creators' profiles can
be opened from discovery and feed experiences.
6.4 Home Feed
The authenticated home feed is the community starting point.

It brings together:
- A personalized welcome area.
- Search entry into creator discovery.
- Shared and available creative projects.
- Creator cards.
- Creators who share the user's selected genres.
- Browse-by-craft sections.
- Shortcuts into projects, discovery, matchmaking, and other platform
  areas.
The feed reads creator and project information from the connected
Supabase backend. It is designed to reflect available community data
rather than being only a permanently hard-coded showcase.
6.5 Discover Creators
The Discover Creators page helps users find people with relevant
creative skills.

Search and filtering options include:
- Creator name and profile information.
- Skills and interests.
- Creator category / craft.
- Genre.
- Experience level.
- Availability.
The page can also surface projects that match a text search.

Creator categories include writers, animators, filmmakers, designers,
artists, music producers, researchers, and content creators.

Opening a creator card leads to that creator's profile, where users can
learn more about their work and initiate a connection or collaboration
request.
6.6 Creative Matchmaking
Creative Matchmaking helps a user describe the type of collaborator
needed for a project.

The user can specify:
- The creator category they are looking for, or choose anyone.
- Relevant genres.
- Required skills.
- Preferred experience level.
- Collaboration preferences.
Crea-Link then ranks available creator profiles and explains why each
creator may be a match.
How matching works
The current implementation uses a transparent rule-based scoring
system, not an AI model.

The matching logic considers:

  Matching factor                   Maximum contribution
  Creator category fit                         25 points
Genre compatibility                          35 points
Skills and creative interests                20 points
Experience level                             10 points
Collaboration preferences                     7 points
Availability                                  3 points
Total possible score                100 points

The implementation clamps the displayed score to a maximum of 99. Match
results include short explanations based on shared genres, skills,
experience, preferences, and collaborator needs.

This makes the matching process understandable: the platform does not
claim that the current matching algorithm is AI-powered.
6.7 Creative Projects
The Creative Projects area is where users create projects, browse
available opportunities, and join projects that need collaborators.

Project information includes:
- Project title.
- Description or premise.
- One or more genres.
- Primary genre.
- Project status.
- Required creative roles.
- Project owner.
- Team members.
- Script information.
- Project milestones.
- Production tasks.
- Portfolio items.
The available project statuses are:
- Planning
- Recruiting
- Developing
- Complete
The project area supports searching and filtering projects by title,
genre, and required creative roles. It also presents open creative
positions so potential collaborators can find projects that need their
skills.

Users can open a project to access its dedicated workspace.
6.8 Collaborative Studio
The Collaborative Studio is the shared workspace for a project owner and
project members.

Each project has its own workspace, project identity, team, content, and
genre-based appearance.

The workspace contains nine sections:
1. Overview
2. Script
3. Group Chat
4. AI Story Assistant
5. Research
6. Team
7. Progress
8. Contributions
9. Portfolio
The sections are described in detail in Project Workspace: Every
Section.

The studio is designed to keep the team's creative process connected
instead of scattering communication, scripts, and production planning
across unrelated tools.
6.9 AI Story Assistant
The AI Story Assistant is one of Crea-Link's two major product
experiences.

It is designed as a creative partner for writers. It receives the
writer's draft, selected genre, selected assistance focus, and optional
project context. It returns structured suggestions that the writer can
review and control.
Story-development tools
The current assistant includes eleven assistance focuses:
  Tool                               What it helps with
  Idea Development                   Expand a premise, sharpen the
central conflict, and explore
possible directions

  Character Development              Explore motivations, character
arcs, backstories, flaws, and
behavior

  Plot Development                   Examine plot holes, pacing, cause
and effect, twists, and endings

  Dialogue Improvement               Improve natural rhythm, subtext,
distinct voices, and emotional
tone

  Story Structure                    Explore acts, beats, midpoint,
turning points, climax, and
resolution

  World-building                     Develop settings, cultures, rules,
history, and the pressures of the
fictional world

  Scene Development                  Work on scene goals, conflict,
sensory detail, and scene endings

  Story Consistency                  Review continuity, timelines,
character voice, and established
rules

  Creative Block Support             Generate gentle questions, small
next steps, and prompts to restart
progress

  Alternative Possibilities          Explore different "what if"
directions
Creative Feedback                  Receive constructive feedback
while preserving the writer's
voice
Genre-aware assistance
The assistant supports five story mood profiles:
- Romance & Love --- intimate, tender, emotionally charged
  storytelling.
- Calm & Comfort --- gentle, grounded, restorative storytelling.
- Moral & Social --- reflective, conscience-driven, human
  storytelling.
- Adventure & Exploration --- bold, discovery-led storytelling.
- Thriller & Dark Society --- tense, unsettling, psychologically
  sharp storytelling.
The selected mood influences the assistant's instructions about
atmosphere, conflict, pacing, and prose voice.
How a writer uses the assistant
1. Open the AI Story Assistant, either as a standalone feature or from
   a project workspace.
2. Choose a free idea or select a project.
3. Enter or edit a story title and draft.
4. Select a genre mood.
5. Choose one of the eleven assistance tools.
6. Add optional details, such as a character focus, dialogue tone, or
   specific instruction.
7. Request suggestions.
8. Review the generated suggestions.
9. Accept useful suggestions, reject unsuitable ones, or ask for a
   revision.
10. Combine accepted suggestions into a recreated story or script.
11. Save a session and return to it later in the same browser.
Writer control
The assistant is not designed to silently overwrite the writer's story.

Its workflow separates suggestions from the main draft. The writer
decides which suggestions to accept, which to reject, and which to
revise. Accepted suggestions can be woven into a combined draft in
either:
- Prose format.
- Screenplay / script format.
Project context
When the assistant is opened inside a project workspace, it receives
context such as:
- Project title.
- Project genres and primary genre.
- Project status.
- Project description.
- Team information.
- Existing script text, where available.
This helps the assistant make suggestions that relate to the project
rather than treating every request as an unrelated prompt.
Revisions and fresh suggestions
The assistant supports multiple generation rounds. It sends previously
seen and rejected suggestion titles to the backend so the model can
avoid repeating the same concepts and can exclude rejected directions.

A suggestion can also be revised using a writer-provided instruction.
Saved suggestions and sessions
Accepted notes and saved sessions are stored in browser localStorage,
using a separate storage key for each project or free-writing workspace.

The current implementation keeps up to twelve saved sessions in that
browser workspace. This is browser-local persistence, not cross-device
cloud synchronization.
AI service dependency
The current server-side AI implementation calls the Lovable AI
Gateway, using the configured model identifier openai/gpt-6-astra.

The AI feature therefore depends on valid access to the Lovable AI
Gateway and available workspace quota/credits. If the gateway is
unavailable or its quota is exhausted, the assistant can return an error
instead of generating suggestions.

The browser client calls an authenticated TanStack Start server
function. The AI provider call is made on the server side; API-provider
credentials are not intended to be placed in frontend code.

The current repository does not yet contain a Gemini replacement for
this AI backend.
6.10 Research Studio
Research Studio helps writers turn a broad topic into a focused research
request.

It is available as a standalone authenticated page and as a section
inside a project workspace.
Research topics
The interface provides quick-start topic chips for:
- Story genre conventions.
- Historical setting.
- Character profession.
- Location and culture.
- Scientific concept.
- Real-world event.
Research question builder
Writers can enter:
- A research question.
- A desired output type.
- Optional additional instructions.
- Optional story context when opened from a project.
Available output types include:
- Quick Overview.
- Detailed Explanation.
- Key Points.
- Historical Context.
- Scientific Analysis.
- Real-world Examples.
- Creative Inspiration.
- Research Report.
- Compare and Contrast.
Crea-Link builds a structured prompt containing the question, requested
output, story context (if supplied), and additional instructions.
External research platforms
The current Research Studio provides these destinations:
- Google Search.
- ChatGPT.
- Claude.
- Google Gemini.
Google Search opens a Google results URL containing the encoded search
question.

For ChatGPT, Claude, and Gemini, Crea-Link copies the prepared research
prompt to the clipboard and opens the selected platform in a new browser
tab. The writer then pastes the prompt into that platform.
Important distinction
Research Studio does not currently perform web search or AI research
inside Crea-Link.

It is a research-prompt builder and external-platform launcher. The
actual response and any sources are produced by the external platform
after the writer submits the prompt there.

The current Research Studio does not require a Crea-Link search API key
or a Crea-Link AI subscription. External platforms may have their own
accounts, availability, and usage limits.
6.11 Requests, Connections, and Collaborations
Crea-Link supports creator-to-creator connection requests and
project-related collaboration workflows.

The connection system supports:
- Sending a request to another creator.
- Including a project title or collaboration context.
- Adding a description or introductory note.
- Listing relevant skills.
- Associating a genre.
- Accepting or declining an incoming request.
- Withdrawing or removing a request/connection where permitted.
- Viewing received and sent requests.
- Viewing accepted collaborations.
The application includes dedicated pages for requests and
collaborations. The navigation also surfaces pending activity so users
can reach requests that need attention.

Project invitations are a separate workflow from general creator
connections. Project owners can create invite codes and, where
configured by the workflow, target an invitation to a specific user.
Users can look up and redeem an invite code to join a project.
6.12 Genre-Based Visual Themes
Crea-Link uses light, pastel genre palettes to give each project a
visual identity.

The main application remains predominantly light and consistent. The
project workspace changes its accent colors according to the project's
primary genre.
  Story mood / genre family          Visual direction
  Love, romance, relationships       Soft pastel pink and lavender

  Peaceful, calming, healing stories Pale sky blue and soft blue

  Morality, society, humanity        Light sage green and mint

  Adventure, exploration, action     Soft pastel orange and peach
Revenge, psychology, horror,       Very light pastel red and muted
thriller                           rose
When a project has multiple genres, its primary genre determines the
main palette. The application uses reusable theme tokens and CSS
variables rather than treating every page as a separate design.

The AI Story Assistant also has its own matching genre-mood profiles.
6.13 Responsive Experience and App Metadata
The project includes:
- Responsive layouts for desktop and smaller screens.
- Desktop and mobile navigation.
- Motion effects and transitions using Framer Motion.
- Reduced-motion support through MotionConfig.
- A web app manifest with Crea-Link name, theme colors, and app icons.
- Favicon, Apple touch icon, and install-oriented icon assets.
- Page metadata such as titles and descriptions for key routes.
The manifest provides install-related metadata. It should not be
interpreted as proof of offline functionality; no offline-first
service-worker behavior is documented in the current project source.
7. Project Workspace: Every Section
This section describes the project workspace at a more practical level.
7.1 Overview
The Overview section introduces the project and presents its key
information, including its title, description, genre, status, team, and
required creative roles.

It helps members understand the project's direction and who is needed to
move it forward.
7.2 Script
The Script section provides a place to upload, view, and edit the
project's script.

The current implementation supports:
- Writing or pasting script text in an editor.
- Saving script text and a filename.
- Uploading .txt files.
- Uploading .docx files.
- Uploading .pdf files.
- Importing supported documents from Google Drive when Drive access is
  configured.
- Removing a project's script.
- Setting script access levels.
Script access levels include:
- Owner only.
- Team members.
- All collaborators.
The project stores script metadata and content separately from the
general project record.

File-processing note: .docx files are processed with Mammoth for
text and HTML extraction. Plain-text files are read as text. The current
PDF handling accepts the file but does not extract PDF text in the same
way as .docx and .txt in the client-side parser.
7.3 Group Chat
The Group Chat section provides project-specific communication.

The underlying implementation supports:
- Chat messages.
- Discussion messages with an optional topic title.
- Sender identity and avatar information.
- Image, video, audio, and document attachments.
- Voice-note recording and sharing in the interface.
- Shared media browsing.
- Message reactions such as heart, clap, idea/spark, and thumbs-up.
- Realtime refresh through Supabase subscriptions.
- Google Drive file selection/import flows when Google Drive is
  configured.
The database stores messages, reactions, and project media as separate
records. Project members are checked before reading or posting project
messages and media.
7.4 AI Story Assistant
The project workspace embeds the same AI Story Assistant used by the
standalone assistant page.

It can receive the project title, primary genre, description, team
context, and available script text. The writer can use the assistant
without leaving the project workspace.

Only project members are allowed to use the project-context assistant
section through the workspace UI.
7.5 Research
The Research section embeds the Research Studio in a compact layout and
passes a short description of the current project as story context.

The writer can prepare a project-related research question and send it
to Google Search, ChatGPT, Claude, or Gemini using the external-platform
workflow described above.
7.6 Team
The Team section supports project membership and invitation workflows.

It includes:
- Viewing project members.
- Viewing member roles and creator information.
- Required creative positions.
- Inviting creators.
- Creating and sharing invite codes or links.
- Joining through an invite code.
- Removing members where permitted.
Project roles include owner, admin, and member at the data-model level.
Creative roles describe what a person contributes to the project.
7.7 Progress
The Progress section helps a team organize production work.

It supports:
- Creating project milestones.
- Setting target dates.
- Updating milestone status.
- Creating tasks.
- Assigning tasks to team members.
- Updating task status.
- Deleting tasks.
- Calculating progress from task completion.
Task statuses are:
- Pending.
- In progress.
- Completed.
The progress summary calculates the total number of tasks, completed
tasks, in-progress tasks, pending tasks, and completion percentage.
7.8 Contributions
The Contributions section provides a view of team contribution
information and peer feedback.

It supports:
- Contribution overview based on project work data.
- Positive feedback.
- Constructive feedback.
- Feedback directed from one project participant to another.
- Recent peer feedback display.
It is intended to encourage useful, specific feedback about
collaboration, delivery, and creative work.
7.9 Portfolio
The Portfolio section is for sharing finished or representative project
work.

Portfolio media categories include:
- Final Animation.
- Finished Video.
- Music & Soundtrack.
- Artwork.
- Character Design.
- Poster.
- Final Script.
- Other Material.
Portfolio entries can include a title, description, media type, uploaded
media, preview image, contributor information, and uploader details.

The project portfolio can act as a showcase of the team's work and
creative progress.
8. Technology Stack
The repository uses the following technologies and libraries.
  Technology                         Purpose
  React 19                           Component-based user interface

  TypeScript                         Typed application code

  TanStack Start                     Full-stack React application
framework and server functions

  TanStack Router                    File-based routing and navigation

  Vite                               Development server and build
tooling

  Tailwind CSS 4                     Utility-first styling

  Radix UI                           Accessible low-level UI primitives

  shadcn-style components            Reusable interface components
built on Radix and Tailwind

  Framer Motion                      Animations and transitions

  Lucide React                       Icons

  Supabase                           Authentication, PostgreSQL
database, storage, and realtime
subscriptions

  Mammoth                            DOCX text and HTML extraction

  Vitest                             Automated tests

  Testing Library                    Component and DOM testing
utilities

  ESLint                             Code linting

  Prettier                           Code formatting

  Drizzle migration files            SQL database migration history and
schema change tracking
Electron (source present)          Desktop-wrapper experiment /
application shell
Runtime versions
The project uses modern Node.js and npm tooling. Use a currently
supported Node.js release compatible with the versions in
package.json. The original development environment used Node.js 26 and
npm 11.
9. Application Architecture
Crea-Link is organized into route-level pages, reusable components,
feature modules, backend service functions, and shared data/state
utilities.
Frontend
- React components render the pages and interactions.
- TanStack Router maps URL paths to route files.
- The authenticated route layout protects the main application.
- Shared state is exposed through StoreProvider and useStore.
- Reusable UI primitives are located in src/components/ui.
- Framer Motion is used for selected page and component transitions.
Server-side functionality
TanStack Start server functions are used for server-side actions such as
AI Story Assistant requests.

The AI request is authenticated through Supabase middleware before it
reaches the provider call.
Backend data access
Supabase is used for:
- User authentication.
- Creator profiles.
- Projects and project membership.
- Collaboration requests.
- Scripts.
- Project messages.
- Message reactions.
- Shared media metadata.
- Project invitations.
- Storage for profile and project files.
- Realtime change notifications.
Shared application state
src/lib/store.tsx maintains the current authenticated user and loads
creator profiles, projects, project memberships, and connection
requests. It subscribes to relevant Supabase table changes and refreshes
the store when data changes.

The Creative Studio also has a dedicated service layer in
src/modules/creative-studio/services/studioService.ts.
10. Database and Backend
The application uses Supabase as its backend. SQL migrations are stored
in drizzle/migrations.
Main database tables
  Table                              Purpose
  profiles                         Creator identity, bio, skills,
genres, experience, availability,
and onboarding state

  connections                      Creator connection and
collaboration requests, including
status and project context

  projects                         Project details, genres, status,
owner, required roles, milestones,
tasks, feedback, and portfolio
data

  project_members                  Users who belong to a project and
their project/creative roles

  project_scripts                  Project script text, file
metadata, uploader, and access
level

  project_messages                 Project chat and discussion
messages

  message_reactions                Reactions attached to project
messages

  project_media                    Metadata for uploaded shared
project files
project_invites                  Project invitation codes, targets,
status, and redemption information
Storage buckets
The migration defines policies for these Supabase Storage buckets:
- profile-media --- profile images and related creator media.
- project-files --- project scripts, shared files, and portfolio
  media.
Realtime
The SQL migration adds relevant tables to the Supabase Realtime
publication, including profiles, connections, projects, project members,
project scripts, project messages, message reactions, project media, and
project invitations.

The frontend uses realtime subscriptions to refresh relevant views when
data changes.
Row Level Security
Row Level Security (RLS) is enabled on the main application tables.
Policies restrict operations according to the signed-in user, project
ownership, project membership, or invitation participation.

Database functions support project membership and invitation
lookup/redemption.

Deployment requirement: The connected Supabase project must have the
required migrations, tables, functions, storage buckets, policies,
authentication settings, and realtime publication configured. A frontend
build alone does not create or configure the production backend.
11. Security and Access Control
Security is handled through a combination of Supabase authentication,
authenticated routes, server-side middleware, and database policies.

Current implementation includes:
- Authenticated route protection.
- Redirects to sign-in for unauthenticated access.
- Onboarding checks before entering the main community pages.
- Supabase Row Level Security on database tables.
- Project membership checks for project messages, media, scripts, and
  collaboration areas.
- Owner-only controls for selected project operations.
- Invitation lookup and redemption through authenticated database
  functions.
- Server-side authentication middleware for the AI Story Assistant
  server function.
- API/provider calls kept on the server where required.
Important deployment practices
- Never commit private API keys, service-role keys, OAuth client
  secrets, or other credentials to GitHub.
- Do not expose a Supabase service-role key in frontend code.
- Use a publishable/anonymous Supabase key in the browser together
  with correct RLS policies.
- Configure allowed OAuth redirect URLs for the deployed domain and
  local development domain.
- Review Supabase policies before deploying changes to production.
- Keep local environment files out of version control.
12. External Services and Configuration
Crea-Link depends on external services for some features.
  Service                 Used for                Configuration / status
  Supabase                Authentication,         Required for the
database, storage,      connected application
realtime                

  Lovable AI Gateway      Current AI Story        Requires valid gateway
Assistant model         access and available
requests                quota

  Google OAuth / Google   Google sign-in and      Requires provider and
Identity Services       optional Drive access   OAuth configuration

  Google Drive API        Importing/exporting     Optional; the
project materials       repository roadmap
identifies the Drive
client ID as a pending
setup item

  Google Search           External research       Opens in a new browser
destination             tab

  ChatGPT                 External research       Opens in a new tab;
destination             prompt is copied for
manual pasting

  Claude                  External research       Opens in a new tab;
destination             prompt is copied for
manual pasting
Gemini                  External research       Opens in a new tab;
destination             prompt is copied for
manual pasting
Google Drive setup
The Drive integration reads VITE_GOOGLE_DRIVE_CLIENT_ID. Without it,
the application displays a message explaining that Drive import is not
configured and users can upload files from their device instead.

A valid Google OAuth Web Client ID, allowed origins, consent
configuration, and Drive API access are required for the integration to
work. The repository roadmap marks Google Drive import as requiring this
configuration.
13. Routes and Navigation Map
The current route structure includes the following pages.
  Route                    Page                   Access
  /                      Landing page           Public

  /auth                  Sign up, sign in, and  Public
password reset request 

  /reset-password        Set a new password     Public
from a reset flow      

  /feed                  Home feed              Authenticated

  /onboarding            Creator profile setup  Authenticated

  /explore               Discover creators and  Authenticated
matching projects      

  /match                 Rule-based creative    Authenticated
matchmaking            

  /projects              Creative Projects      Authenticated

  /studio                Projects owned by or   Authenticated
joined by the current
user                   

  /studio/$projectId     Individual project     Authenticated
workspace              

  /assistant             Standalone AI Story    Authenticated
Assistant              

  /research              Standalone Research    Authenticated
Studio                 

  /profile               Current user's profile Authenticated
and account actions    

  /requests              Sent and received      Authenticated
collaboration requests 

  /collaborations        Accepted/current       Authenticated
collaborations         
/creators/$creatorId   Individual creator     Authenticated
profile
The main navigation provides direct access to Home, Discover Creators,
Creative Projects, Collaborative Studio, AI Story Assistant, Research,
and My Profile. Additional links provide access to matchmaking,
requests, and collaborations.
14. Local Development Setup
Prerequisites
Install:
- Node.js (use a version compatible with the project dependencies).
- npm.
- Git (optional, for cloning and version control).
- Visual Studio Code or another code editor.
Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
Install dependencies
npm install
On Windows PowerShell, if the npm command is blocked by the PowerShell
script execution policy, use:
npm.cmd install
Configure environment variables
Create a local .env file using the variable names listed in
Environment Variables. Use credentials from
the correct Supabase project. Do not copy private credentials into
source code or commit them.
Start the development server
npm run dev
On Windows PowerShell, use:
npm.cmd run dev
Open the local URL printed by Vite in the terminal.
Create a production build
npm run build
On Windows PowerShell:
npm.cmd run build
Run automated tests
npm test
On Windows PowerShell:
npm.cmd test
Run linting
npm run lint
On Windows PowerShell:
npm.cmd run lint
15. Environment Variables
The current source references the following environment variables.
  Variable                          Required?            Purpose
  SUPABASE_URL                    Yes for              Supabase project URL
server/runtime
configuration        

  SUPABASE_PUBLISHABLE_KEY        Yes for              Supabase publishable
server/runtime       key
configuration        

  VITE_SUPABASE_URL               Yes for browser      Supabase URL exposed
build                to the frontend

  VITE_SUPABASE_PUBLISHABLE_KEY   Yes for browser      Supabase publishable
build                key exposed to the
frontend

  SUPABASE_PROJECT_ID             Present in the       Supabase project
project environment  identifier

  VITE_SUPABASE_PROJECT_ID        Present in the       Frontend project
project environment  identifier

  VITE_GOOGLE_DRIVE_CLIENT_ID     Optional; required   Google OAuth Web
for Drive            Client ID
integration          

  LOVABLE_CRON_SECRET             Runtime-dependent    Secret used by
Lovable cron
authentication
utilities

  LOVABLE_CRON_SECRET_PREVIOUS    Runtime-dependent    Previous cron secret
for rotation support
SUPABASE_SERVICE_ROLE_KEY       Server-only if a     Privileged Supabase
deployment task      service-role
requires it          credential; never
expose in frontend
code
Only configure the variables required by the deployment environment. The
browser should receive only public configuration values. Private secrets
must remain server-side.
16. Testing and Quality Checks
The repository includes Vitest-based tests.
Current automated tests
- Application routing test: verifies that the root path /
  resolves to an actual route rather than the not-found route.
- Genre theme test: verifies the genre-to-palette mapping for
  romance, peaceful, social/moral, adventure, and dark/thriller
  genres, including the rule that the primary genre determines the
  main palette when a project has multiple genres.
Recommended manual checks before a public demo
1. Open the landing page.
2. Create a test account or sign in with a configured account.
3. Complete creator onboarding.
4. Edit the profile and confirm that the saved profile data appears.
5. Search for creators and test the available filters.
6. Open the matchmaking page and change the matching criteria.
7. Create a project and verify that it appears in the project list.
8. Open the project workspace.
9. Edit and save a script.
10. Test group messages and media upload with at least two project
    accounts.
11. Test invitation creation and redemption.
12. Create a task and milestone, then update their statuses.
13. Submit peer feedback.
14. Add a portfolio item.
15. Test the AI Story Assistant while the Lovable AI Gateway is
    available and has quota.
16. Test the Research Studio by opening each external platform in a
    normal browser tab.
17. Switch between projects with different primary genres and verify
    their color themes.
18. Run the production build and review any errors.
A successful frontend build does not by itself prove that Supabase
authentication, storage, realtime, OAuth, Google Drive, or the AI
provider is correctly configured. Those integrations need runtime
testing against their actual services.
17. Current Scope and Important Limitations
This section is intentionally explicit so that readers can distinguish
implemented behavior from planned or externally dependent functionality.
  Area                 Current repository   Important limitation /
implementation       dependency
  Landing page         Implemented          Public introduction and entry
points

  Authentication       Supabase             Requires correct Supabase and
email/password plus  OAuth provider settings
configured OAuth
integration          

  Creator profiles     Implemented with     Requires configured database
Supabase-backed      and RLS
profile data         

  Home feed            Implemented using    Community activity depends on
available creator    actual users and projects
and project data     

  Creator discovery    Search and filters   Results depend on available
implemented          profiles

  Creative matchmaking Implemented with     It is rule-based, not AI
deterministic        matchmaking
scoring rules        

  Creative projects    Project creation,    Requires backend tables and
browsing, joining,   policies
and workspace
navigation are
implemented in the
code                 

  Collaborative Studio Project workspace    Full multi-user behavior
with scripts, chat,  depends on Supabase
team, progress,      configuration and runtime
contributions, and   permissions
portfolio sections   

  AI Story Assistant   Server-side          Requires working gateway access
integration with     and available credits/quota
Lovable AI Gateway   

  Research Studio      Prompt builder and   It does not perform research or
external-platform    fetch results inside Crea-Link
launcher             

  Adaptation Research  Not present in the   A separate feature would need
current source       to be implemented
reviewed             

  Google Drive         Integration code is  Requires
present              VITE_GOOGLE_DRIVE_CLIENT_ID
and Google OAuth/API
configuration

  Saved AI sessions    Browser-local        Not synchronized between
storage              devices or stored as cloud
sessions

  Genre themes         Implemented with     Theme follows the project's
genre-to-palette     primary genre
mappings             
Offline mode         Not established by   A web manifest alone does not
the current source   provide offline support
AI quota behavior
The current AI Story Assistant is connected to the Lovable AI Gateway.
If the workspace quota is exhausted, AI generation can fail until
gateway access/quota is restored or the backend provider is changed.
Research behavior
Research Studio intentionally opens external platforms. It does not
embed Google, ChatGPT, Claude, or Gemini in the page, and it does not
retrieve their answers back into Crea-Link.
Missing source modules
The repository roadmap notes that only four of the six originally
described source modules were supplied for integration. The current
codebase is the integrated project represented by this repository; it
should not be described as containing every possible feature from the
original six-module plan.
18. Planned Improvements
The following items are possible next steps, not claims about
functionality already delivered:
- Configure Google Drive OAuth and validate Drive import/export in the
  deployed environment.
- Replace or supplement the current Lovable AI Gateway integration
  with another provider if required by product cost, quota, or
  deployment needs.
- Add a dedicated in-app research backend with verifiable source
  retrieval, if Crea-Link is intended to display research results
  without sending users to external platforms.
- Add Adaptation Research as a distinct research workflow for finding
  adaptations of books, comics, webtoons, stories, films, and games.
- Move saved AI sessions from browser-local storage to authenticated
  cloud storage if cross-device persistence is required.
- Expand automated tests to cover project creation, invitation
  redemption, access control, and key studio workflows.
- Complete a full two-account end-to-end test of collaboration,
  realtime chat, media sharing, and permissions.
- Review and document the final production deployment and environment
  configuration.
19. Repository Structure
The following is a guide to the main source folders and files.
.
├── public/
│   ├── app icons, favicon, and web app manifest
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── genre and creative-work visual assets
│   ├── components/
│   │   ├── creator/             # Creator cards and profile views
│   │   ├── feed/                # Feed project cards
│   │   ├── layout/              # App header and navigation
│   │   ├── match/               # Match result cards
│   │   ├── profile/             # Profile forms
│   │   ├── requests/            # Collaboration request UI
│   │   └── ui/                  # Reusable UI primitives
│   ├── data/
│   │   └── creators.ts          # Creator-related data types and assets
│   ├── features/
│   │   ├── research/            # Research Studio
│   │   └── story-assistant/     # AI Story Assistant and its components
│   ├── generated/
│   │   └── ai-gateway/          # Generated AI gateway model types
│   ├── hooks/                   # Shared React hooks
│   ├── integrations/
│   │   ├── lovable/             # Lovable authentication integration
│   │   └── supabase/            # Supabase clients and auth middleware
│   ├── lib/
│   │   ├── store.tsx            # Shared authenticated app state
│   │   ├── categories.ts        # Creator categories and preferences
│   │   ├── genres.ts            # Genre definitions and palettes
│   │   ├── genre-theme.ts       # Project genre theme mapping
│   │   ├── matchmaking.ts       # Rule-based creator matching
│   │   └── storage-urls.ts      # Supabase storage URL helpers
│   ├── modules/
│   │   └── creative-studio/
│   │       ├── components/      # Project workspace sections
│   │       ├── services/        # Studio and Google Drive services
│   │       ├── theme/           # Project workspace genre themes
│   │       └── types/           # Studio data types
│   ├── routes/
│   │   ├── _authenticated/      # Protected application pages
│   │   ├── auth.tsx             # Sign-in and sign-up
│   │   ├── index.tsx            # Public landing page
│   │   └── reset-password.tsx   # Password reset
│   ├── test/                    # Vitest tests
│   ├── router.tsx               # TanStack Router creation
│   ├── routeTree.gen.ts         # Generated route tree
│   ├── server.ts                # Server entry and error handling
│   ├── start.ts                 # TanStack Start middleware setup
│   └── styles.css               # Global styles and theme tokens
├── drizzle/
│   └── migrations/              # SQL schema and policy migrations
├── electron/
│   └── main.cjs                 # Electron wrapper source
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── README.md
Some generated files and supporting assets are omitted from this
overview for readability.
20. Project Philosophy
Crea-Link is built around a simple idea: creative work becomes
stronger when people with different skills can find each other and build
together.

A writer may have the story but need an animator. An animator may have
the visual direction but need a scriptwriter. A filmmaker may need a
soundtrack, a designer, or a researcher. Crea-Link is intended to help
these creators discover one another and work inside a shared project
environment.

The AI Story Assistant adds another kind of support. It can offer
possibilities, ask the writer to consider alternatives, and help develop
a draft. But the final creative choices remain with the human author.

Crea-Link aims to connect:
- People through creator discovery and collaboration.
- Ideas through story development and research prompts.
- Work through shared scripts, media, chat, tasks, milestones, and
  portfolios.
- Creative direction through project-specific genre themes.
- Human imagination with AI assistance that supports rather than
  replaces it.
Crea-Link --- Find your people. Grow your story.
