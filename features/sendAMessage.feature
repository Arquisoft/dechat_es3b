Feature: Start a chat

  Scenario Outline: Send a message
    Given a "<user>" and a "<friend>"
    When a "<user>" send a "<message>" to "<friend>" in "<chat>"
    Then the "<message>" is shown "<reply>"

  Examples:
    | user | friend | chat | message | reply |
    | userTest3 | friendTest3 | chatUserTest3WithFriendTest3 | Hola | message send |