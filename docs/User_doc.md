# T-DEV-600 Mobile Application Trello

## Summary

- Introduction
- Application Overview
- Main Purpose and Feature
- Installation
- Installation Commands
- Application Navigation
- User Interface
- Navigating Elements
- General Use
- Using Different Components

## Introduction

### Application Overview

Our application aims to replicate Trello's functionality on Android or iOS, enhancing ergonomics to suit the utilized system better. This approach improves connectivity and makes using Trello more convenient and faster than on a PC.

### Main Purpose and Feature

The primary goal of our application is to enable Trello's use on smartphones for more efficient project management. It fetches all information directly from Trello, allowing for real-time management from a smartphone.

## Installation

### Installation Commands

First, clone the project using the command `git clone https://github.com/your-username/Trellow.git`
Open the project in your IDE.
Open a new terminal and use `npm install` to install all necessary packages.
Create a `.env` file at the project's root containing your Trello API and OpenAI keys:

```
TRELLO_API_KEY=yourapikey
OPENAI_API_KEY=yourapikey
```

Ensure your smartphone and computer are on the same network, then launch `npm run start` in your terminal.

## Application Navigation

Navigation within the application is straightforward, thanks to our optimized and readable user interface.

### User Interface

The user interface is divided into three main sections:

- **Sidebar**: This component allows for navigating and modifying boards. It also manages workspaces through a dedicated button.

- **NavBar**: This component enables navigation and modification of the different cards within the selected board.

- **Main Panel**: It contains all elements within the cards, i.e., the items/tasks. This menu allows for managing these elements and moving them between different cards.

### Navigating Elements

Navigation is primarily through a swipe system.

- To change cards, swipe in the desired navigation direction on the nav-bar. Buttons are available for changing cards without swiping.

- To move items between cards, swipe in the desired direction.

- To open the sidebar, a button is always present on the left side of the display. Once opened, you can click on the desired board from the scrollable list.

- To close the sidebar, swipe from right to left or use the dedicated button.

- A contextual menu appears for each element upon long press, allowing for the deletion or modification of the selected element.

## General Use

The application simplifies managing your Trello tasks. Once logged in, use the sidebar to navigate between your boards and workspaces. The NavBar at the top allows switching between cards within a board. Tasks can be reorganized with a simple swipe. Long pressing a task opens a menu to edit or delete it. For a quick and secure logout, use the dedicated button.
