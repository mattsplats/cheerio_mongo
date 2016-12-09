'use strict';

// On load
$(function () {
  $('#add').click(e => {
    const comment = $('#new_comment').val().trim();

    $.post('/', {comment: comment}, data => {
      $('#comments').append(`${data.comment}<br/>`);
      $('#new_comment').val('');
    })
  })

  $('#delete').click(e => {
    $.ajax({
      method: 'DELETE'
    }).then(data =>
      $('#comments').empty()
    )
  })
});