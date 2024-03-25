# Trellow Project

## Introduction

Welcome to the Trellow project! This application is designed to be a project management app using the Trello API. It offers a range of features to help you manage your workspaces, boards, lists, and cards.

## Installation

To get started with the Trellow project, follow these steps:

1. Clone the repository: `git clone https://github.com/your-username/Trellow.git`
2. Install the necessary dependencies: `npm install`
3. Configure your API credentials:
   - Create a Trello API key and token by following the instructions [here](https://trello.com/power-ups/admin/). And Create a Open-AI API key [here](https://platform.openai.com/api-keys).
   - Create a `.env` file and insert this inside
   ```
   TRELLO_API_KEY=yourapikey
   OPENAI_API_KEY=yourapikey
   ```

## Start the project

```shell 
npm run start
```

## Features

The Trellow project offers the following features:

- Create, update, delete, and display workspaces
- Create, update, delete, and display boards with template choice (e.g., kanban)
- Create, update, delete, and display lists
- Create, update, delete, and display cards on a list
- Assign persons to a card

## User Interface and Experience

We have put a strong emphasis on providing a high-quality, polished UX and UI for the Trellow application. We have considered various ideas to enhance the user experience and have designed the app interface accordingly. We have followed the guidelines provided by the chosen technology to ensure a consistent and intuitive user interface.

## Testing

Testing is an important part of the development process. We have implemented a comprehensive test strategy for the Trellow application to ensure that it works properly and meets the specified requirements. We have incorporated [insert test framework here] to facilitate testing and improve the overall quality of the application.

## Documentation

We have provided clear and comprehensive documentation for the Trellow project. The documentation includes class diagrams, sequence diagrams, and components life cycle, depending on the chosen framework and libraries. The goal of the documentation is to help newcomers understand the project architecture and reduce the learning curve. It also serves as a communication tool for team members.

## Bonus Features

- Add a task suggestion, this feature gives you a suggestion for a task provided on your current tasks, this feature is powered by AI.

## Resources

Here are some useful links related to the Trello API:

- [API base URL](https://api.trello.com)
- [Endpoints documentation](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/)
- [Token generation](https://trello.com/app-key)

## Conclusion

Thank you for choosing the Trellow project! We hope you find this application useful for managing your projects. If you have any questions or need further assistance, please don't hesitate to reach out to our support team.
