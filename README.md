# SecretSanta
Secret Santa Draw Application

A Python application that orchestrates a Secret Santa gift exchange draw for four couples (8 individuals). The application ensures that:
- Each person gives a gift to exactly one other person
- No one draws themselves
- No one draws their spouse

## Features

- **Constraint Validation**: Automatically validates that no one is assigned to themselves or their spouse
- **Randomized Draw**: Each execution produces a different valid assignment
- **Comprehensive Testing**: Includes 23 unit tests covering all edge cases
- **Clear Output**: Displays all assignments and verifies constraints

## Requirements

- Python 3.6 or higher
- No external dependencies required (uses only Python standard library)

## Usage

### Running the Application

Simply run the main script:

```bash
python3 secret_santa.py
```

This will perform a draw for the default four couples scenario and display the results.

### Example Output

```
Secret Santa Gift Exchange Draw
========================================

Participants:
  - Alice (spouse: Bob)
  - Bob (spouse: Alice)
  - Charlie (spouse: Diana)
  - Diana (spouse: Charlie)
  - Eve (spouse: Frank)
  - Frank (spouse: Eve)
  - Grace (spouse: Henry)
  - Henry (spouse: Grace)

Performing Secret Santa draw...
Draw successful!

Secret Santa Assignments:
----------------------------------------
Alice → Charlie
Bob → Frank
Charlie → Grace
Diana → Eve
Eve → Diana
Frank → Henry
Grace → Alice
Henry → Bob

Verification:
  ✓ All assignments are valid!
  ✓ No one drew themselves
  ✓ No one drew their spouse
```

### Using as a Library

You can also use the module in your own Python code:

```python
from secret_santa import Person, SecretSantaDraw, create_four_couples_scenario

# Use the default four couples scenario
participants = create_four_couples_scenario()

# Or create your own participants
participants = [
    Person("Alice", "Bob"),
    Person("Bob", "Alice"),
    Person("Charlie", "Diana"),
    Person("Diana", "Charlie"),
    # ... add more participants
]

# Perform the draw
draw = SecretSantaDraw(participants)
if draw.perform_draw():
    # Get individual assignments
    alice_gives_to = draw.get_assignment("Alice")
    print(f"Alice gives a gift to: {alice_gives_to}")
    
    # Or get all assignments
    all_assignments = draw.get_all_assignments()
    for giver, receiver in all_assignments.items():
        print(f"{giver} → {receiver}")
else:
    print("Could not find a valid draw")
```

## Running Tests

Run the comprehensive test suite:

```bash
python3 -m unittest test_secret_santa.py -v
```

All 23 tests should pass, covering:
- Person class functionality
- Draw algorithm correctness
- Constraint validation
- Edge cases and error handling
- The four couples scenario

## Algorithm

The application uses a randomized algorithm with backtracking to find valid assignments:

1. Shuffle the list of givers and receivers
2. For each giver, find all valid receivers (not themselves, not their spouse)
3. Randomly assign one of the valid receivers
4. If any giver has no valid receivers, restart the process
5. Repeat until a valid assignment is found (typically succeeds on first attempt)

The algorithm is efficient and usually finds a valid solution immediately for the four couples scenario.

## Project Structure

```
SecretSanta/
├── README.md              # This file
├── secret_santa.py        # Main application and library code
└── test_secret_santa.py   # Comprehensive unit tests
```

## License

See LICENSE file for details.
