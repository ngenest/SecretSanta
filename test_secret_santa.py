"""
Unit tests for the Secret Santa application.
"""

import unittest
from secret_santa import Person, SecretSantaDraw, create_four_couples_scenario


class TestPerson(unittest.TestCase):
    """Test cases for the Person class."""
    
    def test_person_creation(self):
        """Test creating a person without a spouse."""
        person = Person("Alice")
        self.assertEqual(person.name, "Alice")
        self.assertIsNone(person.spouse)
    
    def test_person_with_spouse(self):
        """Test creating a person with a spouse."""
        person = Person("Bob", "Alice")
        self.assertEqual(person.name, "Bob")
        self.assertEqual(person.spouse, "Alice")
    
    def test_person_equality(self):
        """Test person equality comparison."""
        person1 = Person("Alice", "Bob")
        person2 = Person("Alice", "Charlie")
        person3 = Person("Bob", "Alice")
        
        self.assertEqual(person1, person2)  # Same name
        self.assertNotEqual(person1, person3)  # Different names
    
    def test_person_hash(self):
        """Test that persons can be used in sets."""
        person1 = Person("Alice")
        person2 = Person("Alice")
        person3 = Person("Bob")
        
        person_set = {person1, person2, person3}
        self.assertEqual(len(person_set), 2)  # Alice should be deduplicated


class TestSecretSantaDraw(unittest.TestCase):
    """Test cases for the SecretSantaDraw class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.participants = create_four_couples_scenario()
        self.draw = SecretSantaDraw(self.participants)
    
    def test_validate_participants_valid(self):
        """Test validation with valid participants."""
        self.assertTrue(self.draw.validate_participants())
    
    def test_validate_participants_too_few(self):
        """Test validation with too few participants."""
        draw = SecretSantaDraw([Person("Alice")])
        self.assertFalse(draw.validate_participants())
    
    def test_validate_participants_duplicate_names(self):
        """Test validation with duplicate names."""
        participants = [
            Person("Alice", "Bob"),
            Person("Bob", "Alice"),
            Person("Alice", "Charlie")  # Duplicate!
        ]
        draw = SecretSantaDraw(participants)
        self.assertFalse(draw.validate_participants())
    
    def test_validate_participants_invalid_spouse(self):
        """Test validation when spouse is not in participants."""
        participants = [
            Person("Alice", "Bob"),
            Person("Charlie", "Diana")  # Bob not in list!
        ]
        draw = SecretSantaDraw(participants)
        self.assertFalse(draw.validate_participants())
    
    def test_validate_participants_non_mutual_spouse(self):
        """Test validation when spouse relationships are not mutual."""
        participants = [
            Person("Alice", "Bob"),
            Person("Bob", "Charlie"),  # Bob's spouse should be Alice!
            Person("Charlie", "Bob")
        ]
        draw = SecretSantaDraw(participants)
        self.assertFalse(draw.validate_participants())
    
    def test_can_draw_self(self):
        """Test that a person cannot draw themselves."""
        alice = Person("Alice", "Bob")
        self.assertFalse(self.draw.can_draw(alice, alice))
    
    def test_can_draw_spouse(self):
        """Test that a person cannot draw their spouse."""
        alice = Person("Alice", "Bob")
        bob = Person("Bob", "Alice")
        self.assertFalse(self.draw.can_draw(alice, bob))
        self.assertFalse(self.draw.can_draw(bob, alice))
    
    def test_can_draw_valid(self):
        """Test that a person can draw someone who is not themselves or their spouse."""
        alice = Person("Alice", "Bob")
        charlie = Person("Charlie", "Diana")
        self.assertTrue(self.draw.can_draw(alice, charlie))
    
    def test_perform_draw_success(self):
        """Test that a valid draw can be performed."""
        result = self.draw.perform_draw()
        self.assertTrue(result)
        self.assertEqual(len(self.draw.assignments), len(self.participants))
    
    def test_perform_draw_no_self_assignment(self):
        """Test that no one is assigned to themselves."""
        self.draw.perform_draw()
        for giver, receiver in self.draw.assignments.items():
            self.assertNotEqual(giver, receiver)
    
    def test_perform_draw_no_spouse_assignment(self):
        """Test that no one is assigned their spouse."""
        self.draw.perform_draw()
        
        # Build a spouse map
        spouse_map = {p.name: p.spouse for p in self.participants if p.spouse}
        
        for giver, receiver in self.draw.assignments.items():
            if giver in spouse_map:
                self.assertNotEqual(receiver, spouse_map[giver])
    
    def test_perform_draw_all_assigned(self):
        """Test that everyone gets exactly one assignment."""
        self.draw.perform_draw()
        
        # Check all givers are assigned
        givers = set(self.draw.assignments.keys())
        expected_givers = {p.name for p in self.participants}
        self.assertEqual(givers, expected_givers)
        
        # Check all receivers are assigned
        receivers = set(self.draw.assignments.values())
        expected_receivers = {p.name for p in self.participants}
        self.assertEqual(receivers, expected_receivers)
    
    def test_get_assignment(self):
        """Test getting an individual assignment."""
        self.draw.perform_draw()
        alice_receiver = self.draw.get_assignment("Alice")
        self.assertIsNotNone(alice_receiver)
        self.assertNotEqual(alice_receiver, "Alice")
        self.assertNotEqual(alice_receiver, "Bob")  # Bob is Alice's spouse
    
    def test_get_assignment_not_found(self):
        """Test getting an assignment for someone not in the draw."""
        self.draw.perform_draw()
        result = self.draw.get_assignment("Unknown")
        self.assertIsNone(result)
    
    def test_get_all_assignments(self):
        """Test getting all assignments."""
        self.draw.perform_draw()
        assignments = self.draw.get_all_assignments()
        self.assertEqual(len(assignments), len(self.participants))
        self.assertIsInstance(assignments, dict)
    
    def test_draw_randomness(self):
        """Test that multiple draws produce different results (with high probability)."""
        results = []
        for _ in range(10):
            draw = SecretSantaDraw(self.participants)
            draw.perform_draw()
            results.append(tuple(sorted(draw.assignments.items())))
        
        # With 10 draws, we should get at least 2 different results
        unique_results = set(results)
        self.assertGreater(len(unique_results), 1)
    
    def test_impossible_draw(self):
        """Test that an impossible draw is detected."""
        # Create a scenario where a valid draw is impossible
        # Two people who can only draw each other but one already has an invalid constraint
        participants = [
            Person("Alice", "Bob"),
            Person("Bob", "Alice")
        ]
        draw = SecretSantaDraw(participants)
        # This should fail because Alice can only draw Bob but Bob is her spouse
        # and vice versa
        result = draw.perform_draw(max_attempts=10)
        self.assertFalse(result)


class TestFourCouplesScenario(unittest.TestCase):
    """Test cases specifically for the four couples scenario."""
    
    def test_create_four_couples_scenario(self):
        """Test creating the default four couples scenario."""
        participants = create_four_couples_scenario()
        self.assertEqual(len(participants), 8)
        
        # Verify all have spouses
        for person in participants:
            self.assertIsNotNone(person.spouse)
        
        # Verify spouse relationships are mutual
        name_to_person = {p.name: p for p in participants}
        for person in participants:
            spouse = name_to_person[person.spouse]
            self.assertEqual(spouse.spouse, person.name)
    
    def test_four_couples_draw_multiple_times(self):
        """Test that the four couples scenario can be drawn multiple times successfully."""
        for _ in range(20):
            participants = create_four_couples_scenario()
            draw = SecretSantaDraw(participants)
            self.assertTrue(draw.perform_draw())
            
            # Verify all constraints
            for giver_name, receiver_name in draw.assignments.items():
                giver = next(p for p in participants if p.name == giver_name)
                self.assertNotEqual(giver_name, receiver_name)  # Not themselves
                self.assertNotEqual(receiver_name, giver.spouse)  # Not their spouse


if __name__ == "__main__":
    unittest.main()
