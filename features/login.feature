Feature: Make login in the chat

  Scenario Outline: Do login in chat
    Given a "<user>" and "<password>" and the user make login
    Then the login is successfull

  Examples:
    | user | password |
    | test3b | SolidTest3b$ |