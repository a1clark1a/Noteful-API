function makeNotesArray() {
  return [
    {
      id: 1,
      name: "First Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the first note ...",
      folders_id: 1
    },
    {
      id: 2,
      name: "Second Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the Second note ...",
      folders_id: 1
    },
    {
      id: 3,
      name: "Third Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the Third note ...",
      folders_id: 1
    },
    {
      id: 4,
      name: "Fourth Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the Fourth note ...",
      folders_id: 2
    },
    {
      id: 5,
      name: "Fifth Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the Fifth note ...",
      folders_id: 3
    },
    {
      id: 6,
      name: "Sixth Note",
      modified: new Date("2029-01-22T16:28:32.615Z"),
      content: "Notes for the the Sixth note ...",
      folders_id: 4
    }
  ];
}

function makeExpectedNotesArray() {
  return [
    {
      id: 1,
      name: "First Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the first note ...",
      folders_id: 1
    },
    {
      id: 2,
      name: "Second Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the Second note ...",
      folders_id: 1
    },
    {
      id: 3,
      name: "Third Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the Third note ...",
      folders_id: 1
    },
    {
      id: 4,
      name: "Fourth Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the Fourth note ...",
      folders_id: 2
    },
    {
      id: 5,
      name: "Fifth Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the Fifth note ...",
      folders_id: 3
    },
    {
      id: 6,
      name: "Sixth Note",
      modified: "2029-01-22T16:28:32.615Z",
      content: "Notes for the the Sixth note ...",
      folders_id: 4
    }
  ];
}

function makeMaliciousNotes() {
  const maliciousNotes = {
    id: 666,
    modified: new Date().toISOString(),
    folders_id: 4,
    name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
  };
  const expectedNotes = {
    ...maliciousNotes,
    name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };

  return {
    maliciousNotes,
    expectedNotes
  };
}

module.exports = { makeNotesArray, makeExpectedNotesArray, makeMaliciousNotes };
