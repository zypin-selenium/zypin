Feature: Google Search
  Demonstrate basic BDD testing with predefined steps

  Scenario: Search for Selenium WebDriver
    Given I navigate to "https://www.google.com"
    When I type "Selenium WebDriver" into "textarea[name='q']"
    And I press Enter in "textarea[name='q']"
    And I wait 2 seconds
    Then I should see "Selenium WebDriver"
