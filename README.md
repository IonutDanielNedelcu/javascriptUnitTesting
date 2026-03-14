# javascriptUnitTesting
Unit Testing &amp; Mutation Analysis in JavaScript

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Run migrations (creates SQLite database and tables)

```bash
npx sequelize-cli db:migrate
```

3. Run seeders (insert roles, teams, positions, users)

```bash
npx sequelize-cli db:seed:all
```

4. Start the server (development)

```bash
npm run dev
```

Server will be available at `http://localhost:3009/graphql`.

Notes
- The project uses SQLite by default (see `config/config.json`).
- If you use `npx nodemon` in `npm run dev`, `nodemon` is included in `devDependencies`.
- To rollback seed data you can run:

```bash
npx sequelize-cli db:seed:undo:all
```

And to undo migrations:

```bash
npx sequelize-cli db:migrate:undo:all
```

If you need a fresh DB:

```bash
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```



## Functionalities

StudyBuddies platform uses RBAC (Role-Based Access Control), with 3 designed application roles: Admins, Managers, and Employees. Each of the roles has specific CRUD (Create, Read, Update, Delete) operations available, listed below.

An admin is created with a seeder script. Upon registration, a user gets the Employee role.

# Admins
Seeing data:
    - Users: all users, a specific user (identified by username), own user
    - Roles: all roles, a specific role (identified by name)
    - Positions: all positions, positions with a specific name, positions with a specific seniority
    - Teams: all teams, a specific team (identified by name)
    - Repositories: all repositories, a specific repository (identified by name)
    - Projects: all projects, a specific project (identified by name), the projects a user (identified by username) is part of
    - Sprints: all sprints unpaged/paged, a specific sprint (identified by project name and sprint number), sprints from a specific project (identified by name) unpaged/paged
    - Tasks: all tasks unpaged/paged, a specific task (identified by id), tasks of a specific project (identified by name) unpaged/paged, tasks of a specific sprint (identified by project name and sprint number) unpaged/paged, tasks of a specific user (identified by username) unpaged/paged, current user's tasks
    - Comments: all comments unpaged/paged, a specific comment (identified by id), comments of a specific task (identified by taskID) unpaged/paged, comments of a specific employee (identified by username) 

Managing data:
    - Users: remove a specific user (identified by username)
    - Roles: add a role to a user, remove a role from a user
    - Positions: create a new positions, add a position to a user, remove a position from a user
    - Teams: create a new team, delete an empty team, change a user's team
    - Repositories: create a repository, (repositories can be assigned to projects via project create/update)
    - Projects: create a project, update a project, delete a project, add a user to a project, remove a user from a project
    - Sprints: create, update, delete sprints
    - Tasks: create, update, delete tasks
    - Comments: create, update, delete comments (authors can modify/delete their own comments; Admins can modify/delete any)

# Managers
Seeing data:
    - Users: all users, a specific user (identified by username), own user
    - Roles: none
    - Positions: all positions, positions with a specific name, positions with a specific seniority
    - Teams: all teams, a specific team (identified by name)
    - Repositories: all repositories, a specific repository (identified by name)
    - Projects: all projects, a specific project (identified by name), the projects a user (identified by username) is part of
    - Sprints: all sprints unpaged/paged, a specific sprint (identified by project name and sprint number), sprints from a specific project (identified by name) unpaged/paged
    - Tasks: all tasks unpaged/paged, a specific task (identified by id), tasks of a specific project (identified by name) unpaged/paged, tasks of a specific sprint (identified by project name and sprint number) unpaged/paged, tasks of a specific user (identified by username) unpaged/paged, current user's tasks
    - Comments: a specific comment (identified by id), comments of a specific task (identified by taskID) unpaged/paged, comments of a specific employee (identified by username) 

Managing data:
    - Users: none
    - Roles: none
    - Positions: add a position to a user, remove a position from a user
    - Teams: change a user's team
    - Repositories: create a repository
    - Projects: create a project, update a project, add a user to a project, remove a user from a project
    - Sprints: create, update, delete sprints
    - Tasks: create and update tasks, delete tasks (Managers can delete tasks)
    - Comments: create, update, delete own comments (authors can modify/delete their own comments)

# Users
Seeing data:
    - Users: a specific user (identified by username), own user
    - Roles: none
    - Positions: none
    - Teams: a specific team (identified by name)
    - Repositories: none
    - Projects: all projects, a specific project (identified by name), the projects a user (identified by username) is part of
    - Sprints: a specific sprint (identified by project name and sprint number), sprints from a specific project (identified by name) unpaged/paged
    - Tasks: a specific task (identified by id), tasks of a specific project (identified by name) unpaged/paged, tasks of a specific sprint (identified by project name and sprint number) unpaged/paged, tasks of a specific user (identified by username) unpaged/paged, current user's tasks
    - Comments: a specific comment (identified by id), comments of a specific task (identified by taskID) unpaged/paged, comments of a specific employee (identified by username) 

Managing data:
    - Users: none
    - Roles: none
    - Positions: none
    - Teams: none
    - Repositories: none
    - Projects: none (can view projects and specific project details)
    - Sprints: none (can view sprint details)
    - Tasks: create and update tasks (any authenticated user); cannot delete tasks (only Admins and Managers)
    - Comments: create, update, delete own comments