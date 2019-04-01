Feature: Make login in the chat

  Scenario Outline: Do login in chat
    Given a "<user>" and "<password>" and the user make bad login
    Then the login is unsuccessfull

  Examples:
    | user | password |
    | userTest3 | passwordInvalid |
    | userInvalid | password |