# Unit Testing &amp; Mutation Analysis in JavaScript

---
## 1. 

---
## 2. 

---
## 3. Testing Strategies and Implementation

### 3.1. Equivalence Class Partitioning
Equivalence classes are documented per field and grouped by entity, with representative inputs and expected output domains.

#### 3.1.1. Users 

1. Register (registerMutation)
   - email
       - emailValidClass (valid)
           - rule: formatValidAndLengthInRangeAndUnique
           - representativeInput: email="thisisanemail@studybuddies.com"
           - expectedOutputDomain: success
       - emailMissingClass (invalid)
           - rule: emailEmptyOrMissing
           - representativeInput: email=""
           - expectedOutputDomain: error "Email is required"
       - emailTooShortClass (invalid)
           - rule: emailLengthLessThan5
           - representativeInput: email="a@b."
           - expectedOutputDomain: error "Email must be between 5 and 254 characters"
       - emailTooLongClass (invalid)
           - rule: emailLengthGreaterThan254
           - representativeInput: email="a"*249 + "@ba.co"
           - expectedOutputDomain: error "Email must be between 5 and 254 characters"
       - emailInvalidFormatClass (invalid)
           - rule: emailDoesNotMatchRegex
           - representativeInput: email="invalid-email"
           - expectedOutputDomain: error "Email is invalid"
       - emailDuplicateClass (invalid)
           - rule: emailAlreadyInUse
           - representativeInput: email="dup@example.com" (pre-seeded)
           - expectedOutputDomain: error "Email already in use"

   - password
       - passwordValidClass (valid)
           - rule: lengthInRange
           - representativeInput: password="StudyBuddies_123"
           - expectedOutputDomain: success
       - passwordMissingClass (invalid)
           - rule: passwordEmptyOrMissing
           - representativeInput: password=""
           - expectedOutputDomain: error "Password is required"
       - passwordTooShortClass (invalid)
           - rule: passwordLengthLessThan8
           - representativeInput: password="abcdefg"
           - expectedOutputDomain: error "Password must be between 8 and 64 characters"
       - passwordTooLongClass (invalid)
           - rule: passwordLengthGreaterThan64
           - representativeInput: password="a"*65
           - expectedOutputDomain: error "Password must be between 8 and 64 characters"

   - username
       - usernameValidClass (valid)
           - rule: lengthInRangeAndUnique
           - representativeInput: username="user123"
           - expectedOutputDomain: success
       - usernameMissingClass (invalid)
           - rule: usernameEmptyOrMissing
           - representativeInput: username=""
           - expectedOutputDomain: error "Username is required"
       - usernameTooShortClass (invalid)
           - rule: usernameLengthLessThan3
           - representativeInput: username="ab"
           - expectedOutputDomain: error "Username must be between 3 and 30 characters"
       - usernameTooLongClass (invalid)
           - rule: usernameLengthGreaterThan30
           - representativeInput: username="a"*31
           - expectedOutputDomain: error "Username must be between 3 and 30 characters"
       - usernameDuplicateClass (invalid)
           - rule: usernameAlreadyInUse
           - representativeInput: username="dupuser" (pre-seeded)
           - expectedOutputDomain: error "Username already in use"

   - firstName
       - firstNameValidClass (valid)
           - rule: lengthInRange
           - representativeInput: firstName="Alice"
           - expectedOutputDomain: success
       - firstNameMissingClass (invalid)
           - rule: firstNameEmptyOrMissing
           - representativeInput: firstName=""
           - expectedOutputDomain: error "First name is required"
       - firstNameTooShortClass (invalid)
           - rule: firstNameLengthLessThan2
           - representativeInput: firstName="A"
           - expectedOutputDomain: error "First name must be between 2 and 50 characters"
       - firstNameTooLongClass (invalid)
           - rule: firstNameLengthGreaterThan50
           - representativeInput: firstName="a"*51
           - expectedOutputDomain: error "First name must be between 2 and 50 characters"

   - lastName
       - lastNameValidClass (valid)
           - rule: lengthInRange
           - representativeInput: lastName="Doe"
           - expectedOutputDomain: success
       - lastNameMissingClass (invalid)
           - rule: lastNameEmptyOrMissing
           - representativeInput: lastName=""
           - expectedOutputDomain: error "Last name is required"
       - lastNameTooShortClass (invalid)
           - rule: lastNameLengthLessThan2
           - representativeInput: lastName="B"
           - expectedOutputDomain: error "Last name must be between 2 and 50 characters"
       - lastNameTooLongClass (invalid)
           - rule: lastNameLengthGreaterThan50
           - representativeInput: lastName="a"*51
           - expectedOutputDomain: error "Last name must be between 2 and 50 characters"

2. Login (loginMutation)

   - email
       - emailValidClass (valid)
           - rule: formatValidAndLengthInRange
           - representativeInput: email="thisisanemail@studybuddies.com"
           - expectedOutputDomain: successOrCredentialCheck
       - emailMissingClass (invalid)
           - rule: emailEmptyOrMissing
           - representativeInput: email=""
           - expectedOutputDomain: error "Email is required"
       - emailTooShortClass (invalid)
           - rule: emailLengthLessThan5
           - representativeInput: email="a@b."
           - expectedOutputDomain: error "Email must be between 5 and 254 characters"
       - emailTooLongClass (invalid)
           - rule: emailLengthGreaterThan254
           - representativeInput: email="a"*249 + "@ba.co"
           - expectedOutputDomain: error "Email must be between 5 and 254 characters"
       - emailInvalidFormatClass (invalid)
           - rule: emailDoesNotMatchRegex
           - representativeInput: email="invalid-email"
           - expectedOutputDomain: error "Email is invalid"

   - password
       - passwordValidClass (valid)
           - rule: lengthInRange
           - representativeInput: password="Login123!"
           - expectedOutputDomain: successOrCredentialCheck
       - passwordMissingClass (invalid)
           - rule: passwordEmptyOrMissing
           - representativeInput: password=""
           - expectedOutputDomain: error "Password is required"
       - passwordTooShortClass (invalid)
           - rule: passwordLengthLessThan8
           - representativeInput: password="abcdefg"
           - expectedOutputDomain: error "Password must be between 8 and 64 characters"
       - passwordTooLongClass (invalid)
           - rule: passwordLengthGreaterThan64
           - representativeInput: password="a"*65
           - expectedOutputDomain: error "Password must be between 8 and 64 characters"

   - accountState
       - userNotFoundClass (invalid)
           - rule: noUserForEmail
           - representativeInput: email="missing@studybuddies.com" (not seeded)
           - expectedOutputDomain: error "Invalid credentials"
       - passwordMismatchClass (invalid)
           - rule: userExistsButPasswordWrong
           - representativeInput: email="login@studybuddies.com", password="NotTheCorrectPassword!"
           - expectedOutputDomain: error "Invalid credentials"

3. Role Assignment (addRoleToUserMutation)

   - context
       - adminContextClass (valid)
           - rule: viewerHasAdminRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminClass (invalid)
           - rule: viewerNotAdmin
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - user
       - userExistsClass (valid)
           - rule: userExists
           - representativeInput: username="target"
           - expectedOutputDomain: success
       - userNotFoundClass (invalid)
           - rule: userDoesNotExist
           - representativeInput: username="missingUser"
           - expectedOutputDomain: error "User not found"

   - role
       - roleExistsClass (valid)
           - rule: roleExists
           - representativeInput: roleName="Manager"
           - expectedOutputDomain: success
       - roleNotFoundClass (invalid)
           - rule: roleDoesNotExist
           - representativeInput: roleName="Unknown"
           - expectedOutputDomain: error "Role not found"
       - roleAlreadyAssignedClass (invalid)
           - rule: userAlreadyHasRole
           - representativeInput: roleName="Employee" (already linked)
           - expectedOutputDomain: error "User already has this role"








#### 3.1.2. Projects

1. Create (createProjectMutation)
   - context
       - adminManagerContextClass (valid)
           - rule: viewerHasAdminOrManagerRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminManagerClass (invalid)
           - rule: viewerNotAdminOrManager
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - name
       - nameValidClass (valid)
           - rule: lengthInRangeAndUnique
           - representativeInput: name="ProjectAlpha"
           - expectedOutputDomain: success
       - nameMissingClass (invalid)
           - rule: nameEmptyOrMissing
           - representativeInput: name=""
           - expectedOutputDomain: error "Project name is required"
       - nameTooShortClass (invalid)
           - rule: nameLengthLessThan3
           - representativeInput: name="ab"
           - expectedOutputDomain: error "Project name must be between 3 and 50 characters"
       - nameTooLongClass (invalid)
           - rule: nameLengthGreaterThan50
           - representativeInput: name="a"*51
           - expectedOutputDomain: error "Project name must be between 3 and 50 characters"
       - nameDuplicateClass (invalid)
           - rule: projectNameAlreadyExists
           - representativeInput: name="ProjectDup" (pre-seeded)
           - expectedOutputDomain: error "A project with this name already exists"

   - repositoryID
       - repositoryMissingClass (valid)
           - rule: repositoryIdNotProvided
           - representativeInput: repositoryID=null
           - expectedOutputDomain: success
       - repositoryIdNotFoundClass (invalid)
           - rule: repositoryIdDoesNotExist
           - representativeInput: repositoryID=999
           - expectedOutputDomain: error "Repository ID not found"
       - repositoryAlreadyAssignedClass (invalid)
           - rule: repositoryAlreadyLinkedToProject
           - representativeInput: repositoryID=1 (already linked)
           - expectedOutputDomain: error "This repository is already assigned to another project"

   - description
       - descriptionValidClass (valid)
           - rule: lengthInRangeOrMissing
           - representativeInput: description="Short desc"
           - expectedOutputDomain: success
       - descriptionTooLongClass (invalid)
           - rule: descriptionLengthGreaterThan500
           - representativeInput: description="a"*501
           - expectedOutputDomain: error "Description must be at most 500 characters"

2. Update (updateProjectMutation)

   - context
       - adminManagerContextClass (valid)
           - rule: viewerHasAdminOrManagerRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminManagerClass (invalid)
           - rule: viewerNotAdminOrManager
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - projectID
       - projectExistsClass (valid)
           - rule: projectExists
           - representativeInput: projectID=1 (existing)
           - expectedOutputDomain: success
       - projectNotFoundClass (invalid)
           - rule: projectDoesNotExist
           - representativeInput: projectID=999
           - expectedOutputDomain: error "Project not found"

   - name
       - nameValidClass (valid)
           - rule: nameLengthInRange
           - representativeInput: name="NewName"
           - expectedOutputDomain: success
       - nameMissingClass (invalid)
           - rule: nameProvidedButEmpty
           - representativeInput: name=""
           - expectedOutputDomain: error "Project name is required"
       - nameTooShortClass (invalid)
           - rule: nameLengthLessThan3
           - representativeInput: name="ab"
           - expectedOutputDomain: error "Project name must be between 3 and 50 characters"
       - nameTooLongClass (invalid)
           - rule: nameLengthGreaterThan50
           - representativeInput: name="a"*51
           - expectedOutputDomain: error "Project name must be between 3 and 50 characters"

   - description
       - descriptionValidClass (valid)
           - rule: lengthInRangeOrMissing
           - representativeInput: description="Updated desc"
           - expectedOutputDomain: success
       - descriptionTooLongClass (invalid)
           - rule: descriptionLengthGreaterThan500
           - representativeInput: description="a"*501
           - expectedOutputDomain: error "Description must be at most 500 characters"

   - repositoryID
       - repositoryMissingClass (valid)
           - rule: repositoryIdNotProvided
           - representativeInput: repositoryID=null
           - expectedOutputDomain: success
       - repositoryIdNotFoundClass (invalid)
           - rule: repositoryIdDoesNotExist
           - representativeInput: repositoryID=999
           - expectedOutputDomain: error "Repository ID not found"

3. Delete (deleteProjectMutation)

   - context
       - adminContextClass (valid)
           - rule: viewerHasAdminRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminClass (invalid)
           - rule: viewerNotAdmin
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - projectID
       - projectExistsClass (valid)
           - rule: projectExists
           - representativeInput: projectID=1 (existing)
           - expectedOutputDomain: success
       - projectNotFoundClass (invalid)
           - rule: projectDoesNotExist
           - representativeInput: projectID=999
           - expectedOutputDomain: error "Project not found"

4. Add User to Project (addUserToProjectMutation)

   - context
       - adminManagerContextClass (valid)
           - rule: viewerHasAdminOrManagerRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminManagerClass (invalid)
           - rule: viewerNotAdminOrManager
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - projectID
       - projectExistsClass (valid)
           - rule: projectExists
           - representativeInput: projectID=1 (existing)
           - expectedOutputDomain: success
       - projectNotFoundClass (invalid)
           - rule: projectDoesNotExist
           - representativeInput: projectID=999
           - expectedOutputDomain: error "Project not found"

   - userID
       - userExistsClass (valid)
           - rule: userExists
           - representativeInput: userID=1 (existing)
           - expectedOutputDomain: success
       - userNotFoundClass (invalid)
           - rule: userDoesNotExist
           - representativeInput: userID=999
           - expectedOutputDomain: error "User not found"

   - linkState
       - notAssignedClass (valid)
           - rule: noExistingLink
           - representativeInput: (userID, projectID) not linked
           - expectedOutputDomain: success
       - alreadyAssignedClass (invalid)
           - rule: userAlreadyAssignedToProject
           - representativeInput: (userID, projectID) pre-linked
           - expectedOutputDomain: error "User is already assigned to this project"

5. Remove User from Project (removeUserFromProjectMutation)

   - context
       - adminManagerContextClass (valid)
           - rule: viewerHasAdminOrManagerRole
           - representativeInput: roles=["Admin"]
           - expectedOutputDomain: success
       - nonAdminManagerClass (invalid)
           - rule: viewerNotAdminOrManager
           - representativeInput: roles=["Employee"]
           - expectedOutputDomain: error "Not authorized"

   - linkState
       - linkExistsClass (valid)
           - rule: userAssignedToProject
           - representativeInput: (userID, projectID) pre-linked
           - expectedOutputDomain: success
       - linkNotFoundClass (invalid)
           - rule: userNotAssignedToProjectOrInvalidIds
           - representativeInput: (userID, projectID) not linked
           - expectedOutputDomain: error "User was not assigned to this project or project/user not found"





### 3.2. Boundary Value Analysis (BVA)
#### 3.2.1. Users
1. Register (registerMutation) boundaries
    - email length: 4 (invalid) / 5 (valid) and 254 (valid) / 255 (invalid)
    - password length: 7 (invalid) / 8 (valid) and 64 (valid) / 65 (invalid)
    - username length: 2 (invalid) / 3 (valid) and 30 (valid) / 31 (invalid)
    - firstName length: 1 (invalid) / 2 (valid) and 50 (valid) / 51 (invalid)
    - lastName length: 1 (invalid) / 2 (valid) and 50 (valid) / 51 (invalid)
2. Login (loginMutation) boundaries
    - email length: 4 (invalid) / 5 (valid) and 254 (valid) / 255 (invalid)
    - password length: 7 (invalid) / 8 (valid) and 64 (valid) / 65 (invalid)

#### 3.2.2. Projects
1. Create (createProjectMutation) boundaries
    - name length: 2 (invalid) / 3 (valid) and 50 (valid) / 51 (invalid)
    - description length: 500 (valid) / 501 (invalid)
    - repositoryID existence: existingId (valid) / nonExistingId (invalid)
2. Update (updateProjectMutation) boundaries
    - name length: 2 (invalid) / 3 (valid) and 50 (valid) / 51 (invalid)
    - description length: 500 (valid) / 501 (invalid)
    - projectID existence: existingId (valid) / missingId (invalid)
    - repositoryID existence: existingId (valid) / nonExistingId (invalid)

### 3.3. Category Partitioning

Note: test cases are derived by combining exactly one choice from each category. One-valid-at-a-time means one category is invalid while all others are valid.

#### 3.3.1. Users

1. Register (registerMutation)
     - prunedCategories
         - none (all fields validated separately)
     - categories
         - emailCategory
         - passwordCategory
         - usernameCategory
         - firstNameCategory
         - lastNameCategory
         - uniquenessCategory
     - representativeValues
         - emailCategory: valid="thisisanemail@studybuddies.com", missing="", tooShort="a@b.", tooLong="a"*249 + "@ba.co", invalidFormat="invalid-email", duplicate="dup@example.com"
         - passwordCategory: valid="StudyBuddies_123", missing="", tooShort="abcdefg", tooLong="a"*65
         - usernameCategory: valid="user123", missing="", tooShort="ab", tooLong="a"*31, duplicate="dupuser"
         - firstNameCategory: valid="Jenna", missing="", tooShort="A", tooLong="a"*51
         - lastNameCategory: valid="Doe", missing="", tooShort="D", tooLong="a"*51
         - uniquenessCategory: emailUnique/usernameUnique (valid), emailDuplicate="duplicate@studybuddies.com", usernameDuplicate="usernameDup"
     - oneValidAtATime
         - registerAllValid, registerEmailMissing, registerEmailTooShort, registerEmailTooLong, registerEmailInvalidFormat, registerEmailDuplicate, registerPasswordMissing, registerPasswordTooShort, registerPasswordTooLong, registerUsernameMissing, registerUsernameTooShort, registerUsernameTooLong, registerUsernameDuplicate, registerFirstNameMissing, registerFirstNameTooShort, registerFirstNameTooLong, registerLastNameMissing, registerLastNameTooShort, registerLastNameTooLong

2. Login (loginMutation)
     - prunedCategories
         - none
     - categories
         - emailCategory
         - passwordCategory
         - accountStateCategory
     - representativeValues
         - emailCategory: valid="thisisanemail@studybuddies.com", missing="", tooShort="a@b.", tooLong="a"*249 + "@ba.co", invalidFormat="invalid-email"
         - passwordCategory: valid="StudyBuddies_123", missing="", tooShort="abcdefg", tooLong="a"*65
         - accountStateCategory: userNotFound="missing@studybuddies.com", passwordMismatch=("login@studybuddies.com", "NotTheCorrectPassword!")
     - oneValidAtATime
         - loginAllValid, loginEmailMissing, loginEmailTooShort, loginEmailTooLong, loginEmailInvalidFormat, loginPasswordMissing, loginPasswordTooShort, loginPasswordTooLong, loginUserNotFound, loginPasswordMismatch

3. Role Assignment (addRoleToUserMutation)
     - prunedCategories
         - none
     - categories
         - contextCategory
         - userCategory
         - roleCategory
     - representativeValues
         - contextCategory: admin=["Admin"], nonAdmin=["Employee"]
         - userCategory: exists="target", notFound="missingUser"
         - roleCategory: exists="Manager", notFound="Unknown", alreadyAssigned="Employee"
     - oneValidAtATime
         - roleAssignmentAllValid, roleAssignmentNonAdmin, roleAssignmentUserNotFound, roleAssignmentRoleNotFound, roleAssignmentRoleAlreadyAssigned

#### 3.3.2. Projects
1. Create (createProjectMutation)
     - prunedCategories
         - descriptionCategory: validAndMissingMerged (both map to success)
         - repositoryCategory: repositoryMissingMergedWithRepositoryValid (both map to success)
     - categories
         - contextCategory
         - nameCategory
         - repositoryCategory
         - descriptionCategory
     - representativeValues
         - contextCategory: adminOrManager=["Admin"], nonAdmin=["Employee"]
         - nameCategory: valid="JavascriptTesting", missing="", tooShort="jt", tooLong="a"*51, duplicate="DuplicateName"
         - repositoryCategory: missingOrValid=null, notFound=999, assigned=1
         - descriptionCategory: valid="Short description", tooLong="a"*501
     - oneValidAtATime
         - createProjectAllValid, createProjectNonAdmin, createProjectNameMissing, createProjectNameTooShort, createProjectNameTooLong, createProjectNameDuplicate, createProjectRepositoryNotFound, createProjectRepositoryAssigned, createProjectDescriptionTooLong

2. Update (updateProjectMutation)
     - prunedCategories
         - descriptionCategory: validAndMissingMerged (both map to success)
         - repositoryCategory: repositoryMissingMergedWithRepositoryValid (both map to success)
     - categories
         - contextCategory
         - projectIdCategory
         - nameCategory
         - descriptionCategory
         - repositoryCategory
     - representativeValues
         - contextCategory: adminOrManager=["Admin"], nonAdmin=["Employee"]
         - projectIdCategory: exists=1, notFound=999
         - nameCategory: valid="NewName", missing="", tooShort="nn", tooLong="a"*51
         - descriptionCategory: valid="Updated description", tooLong="a"*501
         - repositoryCategory: missingOrValid=null, notFound=999
     - oneValidAtATime
         - updateProjectAllValid, updateProjectNonAdmin, updateProjectNotFound, updateProjectNameMissing, updateProjectNameTooShort, updateProjectNameTooLong, updateProjectDescriptionTooLong, updateProjectRepositoryNotFound

3. Delete (deleteProjectMutation)
     - prunedCategories
         - none
     - categories
         - contextCategory
         - projectIdCategory
     - representativeValues
         - contextCategory: admin=["Admin"], nonAdmin=["Employee"]
         - projectIdCategory: exists=1, notFound=999
     - oneValidAtATime
         - deleteProjectAllValid, deleteProjectNonAdmin, deleteProjectNotFound

4. Add User to Project (addUserToProjectMutation)
     - prunedCategories
         - none
     - categories
         - contextCategory
         - projectIdCategory
         - userIdCategory
         - linkStateCategory
     - representativeValues
         - contextCategory: adminOrManager=["Admin"], nonAdmin=["Employee"]
         - projectIdCategory: exists=1, notFound=999
         - userIdCategory: exists=1, notFound=999
         - linkStateCategory: notAssigned="(userID, projectID) not linked", alreadyAssigned="(userID, projectID) pre-linked"
     - oneValidAtATime
         - addUserToProjectAllValid, addUserToProjectNonAdmin, addUserToProjectProjectNotFound, addUserToProjectUserNotFound, addUserToProjectAlreadyAssigned

5. Remove User from Project (removeUserFromProjectMutation)
     - prunedCategories
         - none
     - categories
         - contextCategory
         - linkStateCategory
     - representativeValues
         - contextCategory: adminOrManager=["Admin"], nonAdmin=["Employee"]
         - linkStateCategory: linkExists="(userID, projectID) pre-linked", linkNotFound="(userID, projectID) not linked"
     - oneValidAtATime
         - removeUserFromProjectAllValid, removeUserFromProjectNonAdmin, removeUserFromProjectLinkNotFound





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