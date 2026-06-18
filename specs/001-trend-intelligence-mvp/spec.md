# Feature Specification: TrendMind AI-Powered Trend Prediction Platform MVP

**Feature Branch**: `001-trend-intelligence-mvp`

**Created**: 2026-06-04

**Last Updated**: 2026-06-08

**Status**: Draft

**Input**: User description: "Build TrendMind, an AI-powered product opportunity intelligence platform that helps creators, affiliate marketers, and digital sellers discover emerging products before they become saturated."

**Vision**: TrendMind is a trend prediction platform, not a trend reporting tool. Most tools identify products that are already viral. TrendMind identifies products during their early growth stage when competition is still low and opportunity is highest.

**Core Question**: Not "What products are trending today?" but "What products are likely to trend next?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Emerging Product Opportunities (Priority: P1)

A content creator opens TrendMind to identify products that are starting to gain traction but haven't become saturated yet. The dashboard immediately shows the top 5-10 emerging product opportunities ranked by prediction score, with AI-generated insights explaining why each product is likely to trend next and what lifecycle stage it's in (Seed, Emerging, Growing, Viral, Saturated, Declining).

**Why this priority**: This is the core value proposition - answering "What products are likely to trend next?" so users can create content before market saturation. A user can get immediate value on their first visit by discovering early-stage opportunities.

**Independent Test**: Can be fully tested by opening the dashboard and verifying that emerging opportunities appear with prediction scores, lifecycle stages, and insights explaining growth signals. Delivers standalone value even without keyword monitoring.

**Acceptance Scenarios**:

1. **Given** the user is not logged in, **When** they visit the dashboard, **Then** they see authentication required message
2. **Given** the user is authenticated, **When** they open the dashboard, **Then** they see top 5-10 emerging product opportunities sorted by prediction score (0-100)
3. **Given** opportunities are displayed, **When** the user views an opportunity, **Then** they see the keyword, prediction score, lifecycle stage (Seed/Emerging/Growing/Viral/Saturated/Declining), and AI-generated insight
4. **Given** an opportunity is in "Emerging" stage, **When** the user views the AI insight, **Then** they see explanation of growth signals (search acceleration, creator adoption rate, video velocity) and why it's likely to trend
5. **Given** the dashboard is loading trend data, **When** data collection is in progress, **Then** the user sees a loading state with progress indication
6. **Given** trend data collection fails, **When** an error occurs, **Then** the user sees a friendly error message explaining the issue and suggested actions

---

### User Story 2 - Monitor Custom Product Keywords (Priority: P2)

A user wants to track specific product keywords they're interested in (e.g., "wireless earbuds", "standing desk"). They add keywords to their watchlist, and the system continuously monitors these keywords across multiple signals to predict which lifecycle stage they're in and whether they're likely to trend.

**Why this priority**: Enables personalization and allows users to focus on their niche. Builds on P1 by adding customization, but P1 provides value even without custom keywords.

**Independent Test**: Can be tested by adding/removing keywords and verifying they appear in the dashboard with prediction scores, lifecycle stages, and growth signals. Works independently once P1 infrastructure exists.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** they click "Add Keyword", **Then** they see a form to enter a product keyword
2. **Given** the user enters a valid keyword, **When** they submit the form, **Then** the keyword is added to their watchlist and prediction analysis begins
3. **Given** the user enters an invalid keyword (empty, special characters only), **When** they submit, **Then** they see validation error with guidance
4. **Given** the user has keywords in their watchlist, **When** they view the dashboard, **Then** they see all monitored keywords with current lifecycle stage and prediction score
5. **Given** the user wants to stop monitoring a keyword, **When** they click "Remove" on a keyword, **Then** the keyword is removed from their watchlist
6. **Given** the user adds a duplicate keyword, **When** they submit, **Then** they see an error indicating the keyword is already monitored

---

### User Story 3 - Understand Product Lifecycle and Timing (Priority: P3)

A user sees a high prediction score of 88 for "portable blender" currently in "Emerging" stage. They want to understand if they're early, on time, or late to the opportunity. They click on the keyword to see detailed AI-generated insights explaining growth signals (e.g., "Search acceleration +180%, Creator adoption rate +220%, Related queries showing breakout growth. Currently in early Emerging stage - strong opportunity window before mainstream adoption").

**Why this priority**: Helps users make timing decisions. Users can act on P1 and P2 without this, but lifecycle insights improve content strategy timing and competitive positioning.

**Independent Test**: Can be tested by clicking any keyword and verifying detailed lifecycle insights appear with historical trend progression, growth signals, and stage transition indicators. Enhances existing data but isn't required for basic opportunity identification.

**Acceptance Scenarios**:

1. **Given** the user sees a keyword on the dashboard, **When** they click the keyword, **Then** they see a detailed view with lifecycle stage, prediction score, and growth signals
2. **Given** the detailed view is open, **When** insights are displayed, **Then** the user sees search acceleration %, video velocity, creator adoption rate, related query growth, and AI explanation of stage and timing
3. **Given** a product is in "Emerging" stage, **When** the user views insights, **Then** they see guidance that this is an attractive early-stage opportunity
4. **Given** a product is in "Viral" stage, **When** the user views insights, **Then** they see warning that competition may be high and opportunity window may be closing
5. **Given** a product is in "Saturated" stage, **When** the user views insights, **Then** they see indication that the user is late to the trend
6. **Given** the user is viewing detailed insights, **When** they click "Back to Dashboard", **Then** they return to the main opportunity list
7. **Given** AI insight generation fails, **When** insights cannot be generated, **Then** the user sees raw growth signal data with a notice that AI insights are unavailable

---

### Edge Cases

- What happens when Google Trends API rate limits are hit? System should queue requests and show stale data with timestamp indicating last update
- How does the system handle keywords with no trend data? Display "Insufficient data" with guidance to try more specific or broader terms
- What if YouTube API quota is exhausted? Fall back to Google Trends only and notify user of partial data, but reduce prediction confidence
- How are seasonal trends handled? AI insights should note seasonality patterns (e.g., "Winter seasonal trend detected - may not sustain year-round growth")
- What if two keywords have identical prediction scores? Sort by lifecycle stage first (Emerging > Seed > Growing), then alphabetical as tiebreaker
- How does the system handle very long keyword phrases (>100 characters)? Truncate with validation message suggesting shorter alternatives
- What if the user has no monitored keywords? Show default emerging opportunities from curated seed list of ~20 high-traffic product categories monitored system-wide
- How are products classified into lifecycle stages when historical data is limited? Default to "Seed" stage with lower prediction confidence until sufficient signal history accumulates
- What if a product rapidly jumps stages (e.g., Emerging → Viral overnight)? AI insights should flag rapid stage transitions and warn that opportunity window may be closing faster than normal
- How does the system distinguish between seasonal spikes and genuine emerging trends? Track year-over-year patterns and flag products with historical seasonal behavior in insights

## Clarifications

### Session 2026-06-04

- Q: How should keywords be normalized and deduplicated in user watchlists? → A: Advanced normalization - lowercase, trim whitespace, remove punctuation, treat plural forms as singular to maximize API efficiency and prevent duplicate trend collection
- Q: What are the relative weights for calculating opportunity scores from trend velocity, search volume change, and engagement metrics? → A: Velocity-focused weighting - 40% trend velocity, 30% search volume change, 30% engagement metrics
- Q: How are default trending opportunities determined when a user has no monitored keywords? → A: Curated seed list of ~20 high-traffic product categories (e.g., "wireless earbuds", "gaming chair", "smart watch") that are always monitored system-wide
- Q: Should all keywords refresh synchronously or be distributed to avoid API rate limits? → A: Staggered refresh - distribute keyword updates evenly over the 1-hour refresh interval to smooth API usage and prevent quota spikes
- Q: What thresholds define trend direction indicators (rising/falling/stable)? → A: Percentage-based thresholds - Rising if >10% increase, Falling if >10% decrease, Stable otherwise

### Session 2026-06-08 (Trend Prediction Pivot)

- Q: How should lifecycle stages be determined from signal data? → A: Rule-based classification engine using multi-signal thresholds: Seed (low absolute volume + low momentum), Emerging (low-medium volume + high acceleration), Growing (medium volume + sustained momentum), Viral (high volume + high absolute engagement), Saturated (high volume + declining momentum), Declining (declining volume + negative momentum)
- Q: What defines the prediction score vs. the old opportunity score? → A: Prediction score (0-100) estimates probability of significant growth in next 7-30 days using acceleration-focused signals: Search Acceleration (30%), Video Velocity (25%), Creator Adoption Rate (20%), Related Query Growth (15%), View Velocity (10%)
- Q: How should the system prioritize acceleration signals over absolute popularity? → A: Calculate rate of change metrics (day-over-day, week-over-week deltas) and weight them higher than raw volumes. Example: 1000→1200 searches (+20%) scores higher than 10000→10500 searches (+5%) despite lower absolute volume
- Q: What is the minimum historical data required to make lifecycle predictions? → A: Minimum 7 days of data points to calculate acceleration; 14 days preferred for confidence; flag predictions as "Low Confidence" if <14 days of history
- Q: How should stage transition thresholds be calibrated? → A: Initial MVP thresholds based on percentile analysis of historical trending products, then refined through ML feedback loop post-MVP. Allow admin configuration of thresholds for experimentation
- Q: Should the platform support trend forecasting beyond lifecycle classification? → A: Defer to post-MVP. Current MVP focuses on lifecycle stage classification and next 7-30 day prediction. Future versions can add longer-term forecasting (60-90 days) and automated discovery without predefined keywords

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to view a dashboard of emerging product opportunities ranked by prediction score
- **FR-002**: System MUST collect trend data from Google Trends API for monitored keywords
- **FR-003**: System MUST collect trend signals from YouTube Data API (search volume, video count, video velocity, view velocity, engagement) for monitored keywords
- **FR-004**: System MUST store historical trend data for each keyword with timestamps to enable acceleration calculations
- **FR-005**: System MUST classify each keyword into a Product Lifecycle Stage: Seed, Emerging, Growing, Viral, Saturated, or Declining
- **FR-006**: System MUST calculate a Prediction Score (0-100) for each keyword estimating probability of significant growth in next 7-30 days using weighted formula: Search Acceleration 30%, Video Velocity 25%, Creator Adoption Rate 20%, Related Query Growth 15%, View Velocity 10%
- **FR-007**: System MUST continuously update lifecycle stage classification based on historical signal progression
- **FR-008**: System MUST generate AI-powered insights explaining lifecycle stage, growth signals, and timing recommendations using the configured AI provider
- **FR-009**: Users MUST be able to add product keywords to their personal watchlist
- **FR-010**: Users MUST be able to remove keywords from their watchlist
- **FR-011**: System MUST validate and normalize keyword input (non-empty, reasonable length, no malicious content, advanced normalization: lowercase, trim whitespace, remove punctuation, singular forms)
- **FR-012**: System MUST detect duplicates using normalized form ("Wireless Earbuds!" and "wireless earbud" treated as same keyword)
- **FR-013**: System MUST display top emerging opportunities (Seed and Emerging stages preferred) sorted by prediction score in descending order
- **FR-014**: System MUST show lifecycle stage indicators for each keyword
- **FR-015**: System MUST show acceleration metrics (search acceleration %, video velocity, creator adoption rate) for each keyword
- **FR-016**: System MUST refresh trend data periodically using staggered updates (distribute keyword refreshes evenly over the 1-hour interval to prevent API quota spikes)
- **FR-017**: System MUST persist user watchlists across sessions
- **FR-018**: System MUST handle API failures gracefully with user-friendly error messages
- **FR-019**: System MUST show the last update timestamp on the dashboard
- **FR-020**: System MUST maintain a curated seed list of ~20 high-traffic product categories that are always monitored to provide default emerging opportunities for new users
- **FR-021**: System MUST flag predictions as "Low Confidence" when historical data is less than 14 days
- **FR-022**: System MUST detect and flag rapid stage transitions (e.g., Emerging → Viral overnight) in AI insights
- **FR-023**: System MUST distinguish between seasonal spikes and genuine emerging trends by tracking year-over-year patterns
- **FR-024**: System MUST support configurable stage transition thresholds to allow experimentation with classification rules

### Code Quality Requirements *(per Constitution Principle I)*

- **CQ-001**: Code MUST use TypeScript strict mode
- **CQ-002**: All public APIs MUST be documented
- **CQ-003**: Clean architecture principles MUST be followed (separation of concerns: data collection, scoring, AI insights, presentation)
- **CQ-004**: No duplicated business logic allowed (opportunity scoring, trend collection)
- **CQ-005**: All code changes MUST pass linting and type checking

### Testing Requirements *(per Constitution Principle II - NON-NEGOTIABLE)*

- **TR-001**: All business logic MUST have unit tests (opportunity scoring algorithm, trend data parsers, keyword validation)
- **TR-002**: Critical workflows MUST have integration tests (complete trend collection pipeline, dashboard rendering, keyword CRUD operations)
- **TR-003**: Minimum coverage target: 80%
- **TR-004**: Bug fixes MUST include regression tests
- **TR-005**: New features require test coverage before merge

### User Experience Requirements *(per Constitution Principle III)*

- **UX-001**: MUST use consistent UI components across the application (buttons, cards, forms)
- **UX-002**: MUST use consistent terminology (trends, signals, keywords, insights, opportunity score)
- **UX-003**: All loading and error states MUST be handled (trend collection in progress, API failures, empty states)
- **UX-004**: MUST be mobile-responsive (dashboard accessible on smartphones and tablets)
- **UX-005**: Dashboard interactions MUST remain intuitive for non-technical users (clear labels, tooltips, onboarding hints)

### Performance Requirements *(per Constitution Principle IV)*

- **PR-001**: Dashboard load time MUST be under 2 seconds
- **PR-002**: API response time MUST be under 500ms for standard requests (fetch opportunities, add/remove keywords)
- **PR-003**: Background jobs MUST be asynchronous (trend data collection, AI insight generation, opportunity score calculation)
- **PR-004**: Trend collection MUST NOT block user requests (users can add keywords while collection runs)
- **PR-005**: Caching MUST be applied where appropriate (trend data cached for 1 hour, opportunity scores cached for 30 minutes)

### Scalability Requirements *(per Constitution Principle V)*

- **SC-001**: Signal providers MUST be pluggable (Google Trends and YouTube are MVP; architecture allows adding TikTok, Reddit, Instagram, marketplaces later)
- **SC-002**: New data sources can be added without modifying existing providers (provider interface abstraction)
- **SC-003**: AI providers MUST be replaceable (support switching between OpenAI, Anthropic, local models without code changes)
- **SC-004**: Notification channels MUST be extensible (architecture supports future email, Slack, webhook notifications)
- **SC-005**: Lifecycle classification engine MUST support future machine learning models (current rule-based engine replaceable with ML model without architecture changes)
- **SC-006**: Signal normalization layer MUST support adding new signal types (video velocity, creator adoption, engagement velocity, etc.) without refactoring existing signals

### Security Requirements *(per Constitution Principle VI)*

- **SE-001**: Authentication MUST be required for all protected endpoints (dashboard, keyword management, trend data)
- **SE-002**: Sensitive credentials MUST be stored in environment variables (Google Trends API key, YouTube API key, AI provider API key, database credentials)
- **SE-003**: Rate limiting MUST be enabled on public APIs (prevent abuse of trend data endpoints)
- **SE-004**: Input validation MUST be required on all endpoints (keyword input sanitization, SQL injection prevention, XSS protection)

### Key Entities

- **Keyword**: Represents a product term being monitored; attributes include original term text, normalized form (lowercase, no punctuation, singular), user owner, creation timestamp, monitoring status, current lifecycle stage
- **TrendDataPoint**: Represents a single trend measurement; attributes include keyword reference, data source (Google Trends/YouTube), timestamp, search volume, engagement metrics, video count, view count, raw API response
- **LifecycleStage**: Classification of product trend maturity; values: Seed (low volume + low momentum), Emerging (low-medium volume + high acceleration), Growing (medium volume + sustained momentum), Viral (high volume + high engagement), Saturated (high volume + declining momentum), Declining (declining volume + negative momentum)
- **PredictionScore**: Calculated score estimating probability of growth in next 7-30 days; attributes include keyword reference, score value (0-100), calculation timestamp, confidence level (Low/Medium/High based on data history), contributing signals (Search Acceleration 30%, Video Velocity 25%, Creator Adoption Rate 20%, Related Query Growth 15%, View Velocity 10%)
- **AccelerationMetrics**: Derived metrics measuring growth velocity; attributes include keyword reference, search acceleration (% change), video velocity (new videos/day), view velocity (view growth rate), creator adoption rate (new creators/day), related query growth, calculation period (7-day, 14-day, 30-day)
- **AIInsight**: Generated explanation for lifecycle stage and prediction; attributes include keyword reference, insight text explaining stage and timing, generation timestamp, AI provider used, confidence score, lifecycle stage explained, timing recommendation (early/on-time/late)
- **StageTransitionEvent**: Historical record of stage changes; attributes include keyword reference, previous stage, new stage, transition timestamp, trigger signals, velocity of transition (normal/rapid)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the top emerging product opportunity (Seed or Emerging stage) within 10 seconds of opening the dashboard
- **SC-002**: System successfully collects and classifies trend data into lifecycle stages for at least 95% of monitored keywords within 5 minutes of addition
- **SC-003**: Dashboard loads and displays emerging opportunities with lifecycle stages in under 2 seconds on standard broadband connection
- **SC-004**: 90% of added keywords receive a prediction score, lifecycle stage classification, and AI insight within 2 minutes (may be flagged as "Low Confidence" if <14 days historical data)
- **SC-005**: System handles at least 100 concurrent users monitoring 50 keywords each without performance degradation
- **SC-006**: Users can add a new keyword and see it in their dashboard with initial lifecycle classification within 10 seconds (acknowledging that full prediction requires historical data accumulation)
- **SC-007**: Error rate for trend data collection is below 5% (accounting for API rate limits and transient failures)
- **SC-008**: Lifecycle stage classification accuracy is validated through manual spot-checking of 100 random keywords (90% should match manual expert classification)
- **SC-009**: Prediction score correlates with actual growth outcomes - 70% of keywords scoring >80 should demonstrate measurable growth within 30 days
- **SC-010**: Users can distinguish between early-stage opportunities (Seed/Emerging) and saturated markets (Viral/Saturated) at a glance through clear stage indicators

## Assumptions

- Users have stable internet connectivity for dashboard access
- Google Trends API and YouTube Data API are accessible and have sufficient quota for MVP user base (estimated 100 users × 50 keywords each)
- Users understand basic product/trend terminology and Product Lifecycle concepts (Seed, Emerging, Growing, Viral, Saturated, Declining) - brief tooltips provided, no extensive onboarding tutorial required
- Authentication system will use a standard solution (Auth0, Firebase Auth, or similar) - not building custom auth
- AI provider will be OpenAI GPT-4 for MVP; provider abstraction allows switching later
- Trend data refresh interval is 1 hour by default with staggered updates distributed evenly to prevent API rate limit spikes
- Historical trend data retention is 90 days for MVP (older data archived or deleted)
- Users are primarily English-speaking (internationalization deferred to post-MVP)
- Desktop/laptop is the primary platform for MVP; mobile-responsive but not mobile-first
- Database will be PostgreSQL or similar relational database for structured trend data storage
- Application will be deployed as a web application (not native mobile apps)
- User limit for MVP is 500 users (scaling beyond this is post-MVP)
- Initial lifecycle stage classification thresholds will be rule-based; machine learning models for classification deferred to post-MVP
- Prediction accuracy validation will be manual spot-checking for MVP; automated validation loop deferred to post-MVP
- Minimum 7 days of historical data required for lifecycle classification; predictions with <14 days flagged as "Low Confidence"
- Related query data from Google Trends will be available for breakout detection (unofficial API limitation acknowledged)
- YouTube API provides sufficient granularity for video velocity and creator adoption metrics
- Signal normalization layer assumes all providers can deliver comparable metrics (search volume, engagement, velocity)
