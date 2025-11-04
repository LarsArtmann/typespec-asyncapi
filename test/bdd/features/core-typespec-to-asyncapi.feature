# language: en
Feature: TypeSpec to AsyncAPI Emission
  As a developer using TypeSpec
  I want to automatically generate AsyncAPI 3.0 specifications
  So that I can document my event-driven architecture consistently

  Scenario: Basic TypeSpec decorator to AsyncAPI channel generation
    Given I have a TypeSpec model with @channel decorator
    When I compile the TypeSpec to AsyncAPI
    Then I should receive a valid AsyncAPI 3.0 document
    And the document should contain the corresponding channel
    And the channel should have the correct operation bindings

  Scenario: Security scheme decorator integration
    Given I have a TypeSpec model with @securityEnhanced decorator
    And the security scheme has valid configuration
    When I compile the TypeSpec to AsyncAPI
    Then the AsyncAPI document should contain securitySchemes
    And the security schemes should match the TypeSpec configuration

  Scenario: Protocol binding generation
    Given I have a TypeSpec model with MQTT protocol binding
    And the MQTT configuration is valid
    When I compile the TypeSpec to AsyncAPI
    Then the AsyncAPI document should contain MQTT operation bindings
    And the bindings should conform to AsyncAPI 3.0 specification

  Scenario: Type safety validation
    Given I have invalid TypeSpec decorator configuration
    When I attempt to compile the TypeSpec to AsyncAPI
    Then I should receive clear validation errors
    And the errors should guide me to correct the configuration
