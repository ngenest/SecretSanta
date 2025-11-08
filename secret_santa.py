"""
Secret Santa Draw Application

This module implements a Secret Santa gift exchange system that ensures:
1. Each person gives a gift to exactly one other person
2. No person draws themselves
3. No person draws their spouse
"""

import random
from typing import Dict, List, Optional, Set


class Person:
    """Represents a person in the Secret Santa draw."""
    
    def __init__(self, name: str, spouse: Optional[str] = None):
        """
        Initialize a person.
        
        Args:
            name: The person's name
            spouse: The name of the person's spouse (if any)
        """
        self.name = name
        self.spouse = spouse
    
    def __repr__(self):
        return f"Person(name='{self.name}', spouse='{self.spouse}')"
    
    def __eq__(self, other):
        if isinstance(other, Person):
            return self.name == other.name
        return False
    
    def __hash__(self):
        return hash(self.name)


class SecretSantaDraw:
    """Manages the Secret Santa gift exchange draw."""
    
    def __init__(self, participants: List[Person]):
        """
        Initialize the Secret Santa draw.
        
        Args:
            participants: List of people participating in the draw
        """
        self.participants = participants
        self.assignments: Dict[str, str] = {}
    
    def validate_participants(self) -> bool:
        """
        Validate that the participants list is valid.
        
        Returns:
            True if valid, False otherwise
        """
        if len(self.participants) < 2:
            return False
        
        # Check for duplicate names
        names = [p.name for p in self.participants]
        if len(names) != len(set(names)):
            return False
        
        # Validate spouse relationships are mutual
        for person in self.participants:
            if person.spouse:
                spouse_obj = next((p for p in self.participants if p.name == person.spouse), None)
                if not spouse_obj:
                    return False
                if spouse_obj.spouse != person.name:
                    return False
        
        return True
    
    def can_draw(self, giver: Person, receiver: Person) -> bool:
        """
        Check if a giver can draw a receiver.
        
        Args:
            giver: The person giving the gift
            receiver: The person receiving the gift
            
        Returns:
            True if the assignment is valid, False otherwise
        """
        # Cannot draw themselves
        if giver.name == receiver.name:
            return False
        
        # Cannot draw their spouse
        if giver.spouse and giver.spouse == receiver.name:
            return False
        
        return True
    
    def perform_draw(self, max_attempts: int = 1000) -> bool:
        """
        Perform the Secret Santa draw.
        
        This uses a randomized algorithm with backtracking to find a valid assignment.
        
        Args:
            max_attempts: Maximum number of attempts to find a valid draw
            
        Returns:
            True if successful, False if no valid assignment could be found
        """
        if not self.validate_participants():
            return False
        
        for attempt in range(max_attempts):
            if self._try_draw():
                return True
        
        return False
    
    def _try_draw(self) -> bool:
        """
        Attempt a single draw.
        
        Returns:
            True if successful, False otherwise
        """
        self.assignments = {}
        givers = self.participants.copy()
        receivers = self.participants.copy()
        
        # Shuffle to randomize the draw
        random.shuffle(givers)
        random.shuffle(receivers)
        
        for giver in givers:
            # Find valid receivers for this giver
            valid_receivers = [
                r for r in receivers 
                if self.can_draw(giver, r)
            ]
            
            if not valid_receivers:
                return False
            
            # Assign a random valid receiver
            receiver = random.choice(valid_receivers)
            self.assignments[giver.name] = receiver.name
            receivers.remove(receiver)
        
        return True
    
    def get_assignment(self, name: str) -> Optional[str]:
        """
        Get the assignment for a person.
        
        Args:
            name: The name of the person
            
        Returns:
            The name of the person they should give a gift to, or None if not found
        """
        return self.assignments.get(name)
    
    def get_all_assignments(self) -> Dict[str, str]:
        """
        Get all assignments.
        
        Returns:
            Dictionary mapping giver names to receiver names
        """
        return self.assignments.copy()
    
    def print_assignments(self, reveal_all: bool = False):
        """
        Print the assignments.
        
        Args:
            reveal_all: If True, print all assignments. If False, print instructions
        """
        if not self.assignments:
            print("No assignments have been made yet.")
            return
        
        if reveal_all:
            print("Secret Santa Assignments:")
            print("-" * 40)
            for giver, receiver in sorted(self.assignments.items()):
                print(f"{giver} → {receiver}")
        else:
            print("Secret Santa draw complete!")
            print(f"Total participants: {len(self.assignments)}")
            print("\nTo see your assignment, call get_assignment(name)")


def create_four_couples_scenario() -> List[Person]:
    """
    Create the default scenario with four couples.
    
    Returns:
        List of 8 people (4 couples)
    """
    couples = [
        ("Alice", "Bob"),
        ("Charlie", "Diana"),
        ("Eve", "Frank"),
        ("Grace", "Henry")
    ]
    
    participants = []
    for person1, person2 in couples:
        participants.append(Person(person1, person2))
        participants.append(Person(person2, person1))
    
    return participants


def main():
    """Main entry point for the Secret Santa application."""
    print("Secret Santa Gift Exchange Draw")
    print("=" * 40)
    print()
    
    # Create participants (4 couples = 8 people)
    participants = create_four_couples_scenario()
    
    print("Participants:")
    for person in participants:
        if person.spouse:
            print(f"  - {person.name} (spouse: {person.spouse})")
        else:
            print(f"  - {person.name}")
    print()
    
    # Perform the draw
    draw = SecretSantaDraw(participants)
    print("Performing Secret Santa draw...")
    
    if draw.perform_draw():
        print("Draw successful!")
        print()
        draw.print_assignments(reveal_all=True)
        print()
        
        # Verify constraints
        print("Verification:")
        all_valid = True
        for giver_name, receiver_name in draw.get_all_assignments().items():
            giver = next(p for p in participants if p.name == giver_name)
            # Check not themselves
            if giver_name == receiver_name:
                print(f"  ✗ {giver_name} drew themselves!")
                all_valid = False
            # Check not spouse
            elif giver.spouse == receiver_name:
                print(f"  ✗ {giver_name} drew their spouse {receiver_name}!")
                all_valid = False
        
        if all_valid:
            print("  ✓ All assignments are valid!")
            print("  ✓ No one drew themselves")
            print("  ✓ No one drew their spouse")
    else:
        print("Draw failed! Could not find a valid assignment.")
    
    print()


if __name__ == "__main__":
    main()
