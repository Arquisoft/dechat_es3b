Feature: Make login in the chat

  Scenario Outline: Do login in chat
    Given a "<user>" and "<password>"
    When the user make login
    Then the login is successfull "<reply>"

  Examples:
    | user | password | reply |
    | userTest3 | passwordTest3 | Login in! |
    | userTest3 | passwordInvalid | error |
    | userInvalid | password | error |