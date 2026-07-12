# Tryouts

## Purpose

Give coaches one connected workflow for scheduling tryouts, collecting registrations, evaluating candidates, making decisions, and converting accepted candidates into permanent players and season roster memberships.

## Workflow

Schedule Tryout → Generate Public Link and QR Code → Candidate Registration → Check-in → Live Evaluation → Accept, Waitlist, or Decline → Create Player and Add to Roster

## Core entities

### TryoutSession
Links organization, team, season, and schedule event. Stores registration state, capacity, public code, evaluation template, and session status.

### TryoutCandidate
Stores submitted registration data, check-in status, temporary tryout number, decision, and optional converted player ID.

### EvaluationTemplate
Defines customizable rating categories, scale, position-specific templates, and organization ownership.

### TryoutEvaluation
Stores evaluator-specific ratings, notes, recommended position, overall score, and recommendation. Multiple evaluators must never overwrite one another.

## Public registration framework

The QR registration system is a reusable subsystem rather than a one-off tryout form. It should later support camps, clinics, open gyms, attendance, and other public registrations.

Public forms require a hosted backend, unique public tokens, server timestamps, duplicate detection, security rules, spam protection, consent handling, and privacy controls. A ScoreFlow account is not required for registrants.

## Evaluation experience

Candidate rows use the dense management-list pattern. Tapping a candidate opens the shared slide-over on iPad and a full-width editor on phone. Rating categories are customizable and may include serving, passing, setting, attacking, blocking, defense, court awareness, communication, effort, and coachability.

## Offline behavior

Coaches must be able to evaluate candidates in a gym without reliable service. Ratings and notes save locally first and sync when connectivity returns.

## Decision conversion

Accepting a candidate offers to create or match a Player profile and add that player to the selected season roster. Tryout history remains linked after conversion, and duplicate player records should be prevented.

## Planned delivery

- Roster workspace foundation
- Tryout data model and dashboard
- Public registration and QR generation
- Live evaluations and multiple evaluators
- Decisions and candidate-to-player conversion
